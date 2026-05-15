import { authenticatedFetch } from './client-api';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from './constants/order-status';
import { formatDate, escapeHtml } from './utils';
import { formatPrice, fromCents, type Currency } from './shop/currency';

interface OrderItemRow {
  productSlug: string;
  productTitle: string;
  quantity: number;
}

interface OrderRow {
  id: string;
  email: string;
  status: OrderStatus;
  currency: Currency;
  subtotal: number;
  total: number;
  stripeSessionId: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  items: OrderItemRow[];
}

interface DownloadInfo {
  id: string;
  token: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  lastUsedAt: string | null;
}

interface OrderDetailItem extends OrderItemRow {
  id: string;
  unitPrice: number;
  currency: Currency;
  fileKey: string | null;
  downloads: DownloadInfo[];
}

interface OrderDetail extends Omit<OrderRow, 'items'> {
  items: OrderDetailItem[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatsData {
  total: number;
  pending: number;
  delivered: number;
  weekCount: number;
  totalRevenueCents: number;
  monthRevenueCents: number;
}

export class OrdersManager {
  private orders: OrderRow[] = [];
  private pagination: PaginationInfo | null = null;
  private currentPage = 1;
  private sortColumn: string = 'createdAt';
  private sortOrder: 'asc' | 'desc' = 'desc';
  private detailOrder: OrderDetail | null = null;

  async loadOrders(page: number = 1) {
    try {
      this.showLoading();
      this.currentPage = page;

      const filters = this.readFilters();
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        sortBy: this.sortColumn,
        sortOrder: this.sortOrder,
      });
      if (filters.status) params.set('status', filters.status);
      if (filters.currency) params.set('currency', filters.currency);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const [ordersRes] = await Promise.all([
        authenticatedFetch(`/api/orders?${params.toString()}`),
        this.fetchStats(),
      ]);

      if (!ordersRes.ok) {
        console.error('Error loading orders');
        return;
      }
      const data = await ordersRes.json();
      this.orders = data.orders;
      this.pagination = data.pagination;
      this.render();
      this.renderPagination();
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortOrder = 'desc';
    }
    this.loadOrders(1);
  }

  changePage(page: number) {
    if (page >= 1 && this.pagination && page <= this.pagination.totalPages) {
      this.loadOrders(page);
    }
  }

  applyFilters() {
    this.loadOrders(1);
  }

  async viewOrder(id: string) {
    try {
      const res = await authenticatedFetch(`/api/orders/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      this.detailOrder = data.order as OrderDetail;
      this.renderDetail();
      this.showModal('order-modal');
    } catch (err) {
      console.error('Error fetching order:', err);
    }
  }

  hideModal() {
    document.getElementById('order-modal')?.classList.add('hidden');
    this.detailOrder = null;
  }

  async resendEmail() {
    if (!this.detailOrder) return;
    const btn = document.getElementById('resend-email-btn') as HTMLButtonElement | null;
    const statusEl = document.getElementById('resend-status');
    try {
      if (btn) btn.disabled = true;
      if (statusEl) {
        statusEl.className = 'text-sm text-gray-600';
        statusEl.textContent = 'Reenviando...';
      }
      const res = await authenticatedFetch(`/api/orders/${this.detailOrder.id}/resend`, {
        method: 'POST',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (statusEl) {
          statusEl.className = 'text-sm text-red-600';
          statusEl.textContent = j.error || 'Error al reenviar';
        }
        return;
      }
      if (statusEl) {
        statusEl.className = 'text-sm text-green-600';
        statusEl.textContent = 'Email reenviado correctamente';
      }
      await this.viewOrder(this.detailOrder.id);
      await this.loadOrders(this.currentPage);
    } catch (err) {
      console.error('Resend error:', err);
      if (statusEl) {
        statusEl.className = 'text-sm text-red-600';
        statusEl.textContent = 'Error de conexión';
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async exportCSV() {
    try {
      const dateFrom = (document.getElementById('export-date-from') as HTMLInputElement)?.value || '';
      const dateTo = (document.getElementById('export-date-to') as HTMLInputElement)?.value || '';
      const status = (document.getElementById('export-status') as HTMLSelectElement)?.value || '';
      const currency = (document.getElementById('export-currency') as HTMLSelectElement)?.value || '';

      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (status) params.set('status', status);
      if (currency) params.set('currency', currency);

      const res = await authenticatedFetch(`/api/orders/export?${params.toString()}`);
      if (!res.ok) {
        console.error('Error exporting orders');
        return;
      }
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos-${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.hideExportModal();
    } catch (err) {
      console.error('Export error:', err);
    }
  }

  showExportModal() {
    this.showModal('export-orders-modal');
  }

  hideExportModal() {
    document.getElementById('export-orders-modal')?.classList.add('hidden');
    ['export-date-from', 'export-date-to'].forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = '';
    });
    const s = document.getElementById('export-status') as HTMLSelectElement | null;
    const c = document.getElementById('export-currency') as HTMLSelectElement | null;
    if (s) s.value = '';
    if (c) c.value = '';
  }

  private readFilters() {
    return {
      status: (document.getElementById('status-filter') as HTMLSelectElement)?.value || '',
      currency: (document.getElementById('currency-filter') as HTMLSelectElement)?.value || '',
      dateFrom: (document.getElementById('date-from-filter') as HTMLInputElement)?.value || '',
      dateTo: (document.getElementById('date-to-filter') as HTMLInputElement)?.value || '',
    };
  }

  private async fetchStats() {
    try {
      const res = await authenticatedFetch('/api/orders/stats');
      if (!res.ok) return;
      const { stats } = await res.json();
      this.updateStats(stats);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  private updateStats(stats: StatsData) {
    const set = (id: string, val: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('stat-total', String(stats.total));
    set('stat-pending', String(stats.pending));
    set('stat-week', String(stats.weekCount));
    set('stat-month-revenue', this.formatRevenue(stats.monthRevenueCents));
    set('stat-total-revenue', this.formatRevenue(stats.totalRevenueCents));
    set('stat-delivered', String(stats.delivered));
  }

  private formatRevenue(cents: number): string {
    // Revenue is mixed-currency in DB; format as EUR baseline for the stat card.
    return formatPrice(fromCents(cents), 'EUR', 'es');
  }

  private render() {
    const loading = document.getElementById('orders-loading');
    const empty = document.getElementById('orders-empty');
    const tableEl = document.getElementById('orders-table');
    const tbody = document.getElementById('orders-tbody');
    if (loading) loading.classList.add('hidden');

    if (this.orders.length === 0) {
      if (empty) empty.classList.remove('hidden');
      if (tableEl) tableEl.classList.add('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    if (tableEl) tableEl.classList.remove('hidden');

    if (tbody) {
      tbody.innerHTML = '';
      this.orders.forEach((o) => tbody.appendChild(this.createRow(o)));
    }
    this.updateSortIcons();
  }

  private createRow(o: OrderRow): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    const total = formatPrice(fromCents(o.total), o.currency, 'es');
    const itemsLabel = o.items.map((i) => `${i.quantity}× ${i.productTitle}`).join(', ');
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-mono text-gray-500">${escapeHtml(o.id.slice(0, 8))}…</div>
        <div class="text-sm text-gray-900 mt-1">${escapeHtml(o.email)}</div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-700 max-w-xs truncate" title="${escapeHtml(itemsLabel)}">${escapeHtml(itemsLabel)}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${escapeHtml(total)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ORDER_STATUS_COLORS[o.status]}">
          ${ORDER_STATUS_LABELS[o.status]}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(o.createdAt)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-indigo-600 hover:text-indigo-900 cursor-pointer view-order-btn" data-order-id="${o.id}">
          Ver detalle
        </button>
      </td>
    `;
    return tr;
  }

  private renderDetail() {
    if (!this.detailOrder) return;
    const o = this.detailOrder;
    const set = (id: string, val: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('detail-id', o.id);
    set('detail-email', o.email);
    set('detail-status', ORDER_STATUS_LABELS[o.status]);
    const statusEl = document.getElementById('detail-status');
    if (statusEl) {
      statusEl.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ORDER_STATUS_COLORS[o.status]}`;
    }
    set('detail-currency', o.currency);
    set('detail-subtotal', formatPrice(fromCents(o.subtotal), o.currency, 'es'));
    set('detail-total', formatPrice(fromCents(o.total), o.currency, 'es'));
    set('detail-created', formatDate(o.createdAt));
    set('detail-paid', o.paidAt ? formatDate(o.paidAt) : '-');
    set('detail-stripe', o.stripeSessionId ?? '-');

    const itemsContainer = document.getElementById('detail-items');
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      const now = Date.now();
      o.items.forEach((item) => {
        const wrap = document.createElement('div');
        wrap.className = 'border border-gray-200 rounded-md p-3 mb-2';
        const unitPrice = formatPrice(fromCents(item.unitPrice), item.currency, 'es');
        const linePrice = formatPrice(fromCents(item.unitPrice * item.quantity), item.currency, 'es');
        const validDownload = item.downloads
          .filter((d) => new Date(d.expiresAt).getTime() > now && d.downloadCount < d.maxDownloads)
          .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime())[0];
        const downloadHTML = validDownload
          ? `<a href="/api/download/${escapeHtml(validDownload.token)}" target="_blank" rel="noopener" class="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mt-2">
               Descargar (${validDownload.downloadCount}/${validDownload.maxDownloads}) — expira ${formatDate(validDownload.expiresAt)}
             </a>`
          : item.fileKey
            ? `<span class="text-xs text-gray-500 mt-2 inline-block">Sin token activo. Reenviá el email para regenerar.</span>`
            : `<span class="text-xs text-gray-500 mt-2 inline-block">Sin archivo digital.</span>`;
        wrap.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm font-medium text-gray-900">${escapeHtml(item.productTitle)}</div>
              <div class="text-xs text-gray-500">${escapeHtml(item.productSlug)} · ${item.quantity} × ${escapeHtml(unitPrice)}</div>
            </div>
            <div class="text-sm font-medium text-gray-900">${escapeHtml(linePrice)}</div>
          </div>
          ${downloadHTML}
        `;
        itemsContainer.appendChild(wrap);
      });
    }

    const resendBtn = document.getElementById('resend-email-btn') as HTMLButtonElement | null;
    if (resendBtn) {
      const canResend = o.status === 'paid' || o.status === 'delivered';
      resendBtn.disabled = !canResend;
      resendBtn.title = canResend ? '' : 'Solo disponible para pedidos pagados';
    }
    const statusEl2 = document.getElementById('resend-status');
    if (statusEl2) {
      statusEl2.textContent = '';
      statusEl2.className = 'text-sm';
    }
  }

  private renderPagination() {
    const container = document.getElementById('orders-pagination');
    if (!container || !this.pagination || this.pagination.totalPages <= 1) {
      if (container) container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    const { page, totalPages } = this.pagination;
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    const btn = (p: number, label: string, active = false, disabled = false) => `
      <button class="relative inline-flex items-center px-3 py-2 text-sm font-medium pagination-btn ${
        active
          ? 'z-10 bg-indigo-600 text-white'
          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
        data-page="${p}" ${disabled ? 'disabled' : ''}>${label}</button>
    `;

    container.innerHTML = `
      <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
        <p class="text-sm text-gray-700">Página <span class="font-medium">${page}</span> de <span class="font-medium">${totalPages}</span></p>
        <nav class="inline-flex -space-x-px rounded-md shadow-sm">
          ${btn(page - 1, '‹', false, page <= 1)}
          ${pages.map((p) => btn(p, String(p), p === page)).join('')}
          ${btn(page + 1, '›', false, page >= totalPages)}
        </nav>
      </div>
    `;
  }

  private updateSortIcons() {
    document.querySelectorAll('[data-sort-column]').forEach((el) => {
      const col = el.getAttribute('data-sort-column');
      const indicator = el.querySelector('.sort-indicator');
      if (!indicator) return;
      if (col === this.sortColumn) {
        indicator.textContent = this.sortOrder === 'asc' ? '▲' : '▼';
      } else {
        indicator.textContent = '';
      }
    });
  }

  private showModal(id: string) {
    document.getElementById(id)?.classList.remove('hidden');
  }

  private showLoading() {
    document.getElementById('orders-loading')?.classList.remove('hidden');
    document.getElementById('orders-empty')?.classList.add('hidden');
    document.getElementById('orders-table')?.classList.add('hidden');
  }
}
