import { authenticatedFetch } from './client-api';
import { FORM_STATUS, FORM_STATUS_LABELS, FORM_STATUS_COLORS } from './constants/form-status';

export interface FormData {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    createdAt: string;
    status?: typeof FORM_STATUS[keyof typeof FORM_STATUS];
    respondedAt?: string;
}

export interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export class FormsManager {
    private allForms: FormData[] = [];
    private filteredForms: FormData[] = [];
    private currentPagination: PaginationData | null = null;
    private currentPage = 1;
    private sortColumn: string | null = null;
    private sortOrder: 'asc' | 'desc' = 'asc';

    async loadForms(page: number = 1, resetSorting: boolean = false) {
        try {
            this.showLoading();
            this.currentPage = page;
            
            if (resetSorting) {
                this.sortColumn = null;
                this.sortOrder = 'asc';
            }
            
            let formsUrl = `/api/forms?page=${page}&limit=10`;
            if (this.sortColumn) {
                formsUrl += `&sortBy=${this.sortColumn}&sortOrder=${this.sortOrder}`;
            }
            
            const [formsResponse, statsResponse] = await Promise.all([
                authenticatedFetch(formsUrl),
                authenticatedFetch('/api/forms/stats')
            ]);
            
            if (formsResponse.ok && statsResponse.ok) {
                const formsData = await formsResponse.json();
                const statsData = await statsResponse.json();
                
                this.allForms = formsData.forms;
                this.currentPagination = formsData.pagination;
                this.filteredForms = [...this.allForms];
                
                this.updateStats(statsData);
                this.renderFormsTable();
                this.updatePagination();
            } else {
                console.error('Error loading forms or stats');
                this.showError('Error al cargar los formularios');
            }
        } catch (error) {
            console.error('Error loading forms:', error);
            this.showError('Error de conexión');
        }
    }

    filterForms() {
        const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
        const selectedStatus = statusFilter?.value;
        
        if (!selectedStatus) {
            this.filteredForms = [...this.allForms];
        } else {
            this.filteredForms = this.allForms.filter(form => 
                (form.status || FORM_STATUS.PENDING) === selectedStatus
            );
        }
        
        this.renderFormsTable();
    }

    sortBy(column: string) {
        if (this.sortColumn === column) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortOrder = 'asc';
        }
        
        this.loadForms(1);
    }

    changePage(page: number) {
        if (page >= 1 && this.currentPagination && page <= this.currentPagination.totalPages) {
            this.loadForms(page);
        }
    }

    async updateFormStatus(formId: string, newStatus: string) {
        try {
            const response = await authenticatedFetch(`/api/forms/${formId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                const formIndex = this.allForms.findIndex(f => f.id === formId);
                if (formIndex !== -1) {
                    this.allForms[formIndex].status = newStatus as typeof FORM_STATUS[keyof typeof FORM_STATUS];
                    if (result.form.respondedAt) {
                        this.allForms[formIndex].respondedAt = result.form.respondedAt;
                    } else {
                        delete this.allForms[formIndex].respondedAt;
                    }
                }
                
                this.hideStatusDropdown(formId);
                this.filterForms();
                
                try {
                    const statsResponse = await authenticatedFetch('/api/forms/stats');
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        this.updateStats(statsData);
                    }
                } catch (error) {
                    console.error('Error reloading stats:', error);
                }
                
            } else {
                console.error('Error updating form status:', await response.text());
                this.showError('Error al actualizar el estado del formulario');
            }
        } catch (error) {
            console.error('Error updating form status:', error);
            this.showError('Error de conexión al actualizar estado');
        }
    }

    async exportCSV() {
        try {
            const dateFromInput = document.getElementById('export-date-from') as HTMLInputElement;
            const dateToInput = document.getElementById('export-date-to') as HTMLInputElement;
            const statusSelect = document.getElementById('export-status') as HTMLSelectElement;
            
            const dateFrom = dateFromInput?.value || '';
            const dateTo = dateToInput?.value || '';
            const status = statusSelect?.value || '';
            
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            if (status) params.append('status', status);
            
            const url = `/api/forms/export?${params.toString()}`;
            const response = await authenticatedFetch(url);
            
            if (response.ok) {
                const csvContent = await response.text();
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                const currentDate = new Date().toISOString().split('T')[0];
                const filename = `formularios-${currentDate}.csv`;
                
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
                
                this.hideExportModal();
            } else {
                console.error('Error exporting CSV:', await response.text());
                this.showError('Error al exportar CSV');
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showError('Error de conexión al exportar');
        }
    }

    viewForm(formId: string) {
        const form = this.allForms.find(f => f.id === formId);
        if (form) {
            this.showFormModal(form);
        }
    }

    toggleStatusDropdown(formId: string) {
        const dropdown = document.getElementById(`status-dropdown-${formId}`);
        
        document.querySelectorAll('[id^="status-dropdown-"]').forEach((element) => {
            if (element.id !== `status-dropdown-${formId}`) {
                element.classList.add('hidden');
            }
        });
        
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    hideStatusDropdown(formId: string) {
        const dropdown = document.getElementById(`status-dropdown-${formId}`);
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    private updateStats(statsData?: any) {
        const totalElement = document.getElementById('total-forms');
        const weekElement = document.getElementById('week-forms');
        const pendingElement = document.getElementById('pending-forms');
        
        if (statsData) {
            if (totalElement) {
                totalElement.textContent = statsData.total.toString();
            }
            if (weekElement) {
                weekElement.textContent = statsData.thisWeek.toString();
            }
            if (pendingElement) {
                pendingElement.textContent = statsData.pending.toString();
            }
        } else {
            if (totalElement && this.currentPagination) {
                totalElement.textContent = this.currentPagination.totalCount.toString();
            }
            
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const thisWeekForms = this.allForms.filter(form => 
                new Date(form.createdAt) >= oneWeekAgo
            );
            
            if (weekElement) {
                weekElement.textContent = thisWeekForms.length.toString();
            }
            
            const pendingForms = this.allForms.filter(form => 
                !form.status || form.status === FORM_STATUS.PENDING
            );
            
            if (pendingElement) {
                pendingElement.textContent = pendingForms.length.toString();
            }
        }
    }

    private renderFormsTable() {
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const formsTable = document.getElementById('forms-table');
        const tbody = document.getElementById('forms-tbody');
        
        if (loadingState) loadingState.classList.add('hidden');
        
        if (this.filteredForms.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (formsTable) formsTable.classList.add('hidden');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        if (formsTable) formsTable.classList.remove('hidden');
        
        if (tbody) {
            tbody.innerHTML = '';
            
            this.filteredForms.forEach(form => {
                const row = this.createFormRow(form);
                tbody.appendChild(row);
            });
        }
        
        this.updateSortIcons();
    }

    private createFormRow(form: FormData): HTMLTableRowElement {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const status = form.status || FORM_STATUS.PENDING;
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${this.escapeHtml(form.name)}</div>
                <div class="text-sm text-gray-500">${this.escapeHtml(form.email)}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">${this.escapeHtml(form.message)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${this.formatDate(form.createdAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="relative">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${FORM_STATUS_COLORS[status]} status-tag" 
                          data-form-id="${form.id}"
                          id="status-tag-${form.id}">
                        ${FORM_STATUS_LABELS[status]}
                    </span>
                    <div id="status-dropdown-${form.id}" class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-32 hidden">
                        <button class="block w-full text-left px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${status === FORM_STATUS.PENDING ? 'bg-yellow-50 text-yellow-800' : 'text-gray-700'} status-option" 
                                data-form-id="${form.id}" data-status="${FORM_STATUS.PENDING}">
                            ${FORM_STATUS_LABELS[FORM_STATUS.PENDING]}
                        </button>
                        <button class="block w-full text-left px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${status === FORM_STATUS.READ ? 'bg-blue-50 text-blue-800' : 'text-gray-700'} status-option" 
                                data-form-id="${form.id}" data-status="${FORM_STATUS.READ}">
                            ${FORM_STATUS_LABELS[FORM_STATUS.READ]}
                        </button>
                        <button class="block w-full text-left px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${status === FORM_STATUS.REPLIED ? 'bg-green-50 text-green-800' : 'text-gray-700'} status-option" 
                                data-form-id="${form.id}" data-status="${FORM_STATUS.REPLIED}">
                            ${FORM_STATUS_LABELS[FORM_STATUS.REPLIED]}
                        </button>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${form.respondedAt ? this.formatDate(form.respondedAt) : '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3 cursor-pointer view-form-btn" data-form-id="${form.id}">
                    Ver
                </button>
                <a href="mailto:${form.email}" class="text-green-600 hover:text-green-900">
                    Responder
                </a>
            </td>
        `;
        
        return row;
    }

    private updateSortIcons() {
        document.querySelectorAll('.sort-icon').forEach(icon => {
            (icon as HTMLElement).style.display = 'none';
        });
        
        if (this.sortColumn) {
            const iconClass = this.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc';
            const activeIcon = document.querySelector(`.sort-icon.${iconClass}[data-column="${this.sortColumn}"]`) as HTMLElement;
            if (activeIcon) {
                activeIcon.style.display = 'block';
                activeIcon.style.color = '#3B82F6';
            }
        }
    }

    private updatePagination() {
        const paginationContainer = document.getElementById('pagination-container');
        
        if (!this.currentPagination || this.currentPagination.totalPages <= 1) {
            if (paginationContainer) paginationContainer.classList.add('hidden');
            return;
        }
        
        if (paginationContainer) {
            paginationContainer.classList.remove('hidden');
            paginationContainer.innerHTML = this.generatePaginationHTML();
        }
    }

    private generatePaginationHTML(): string {
        if (!this.currentPagination) return '';
        
        const { currentPage, totalPages } = this.currentPagination;
        const maxVisible = 5;
        
        const getVisiblePages = (current: number, total: number): number[] => {
            if (total <= maxVisible) {
                return Array.from({ length: total }, (_, i) => i + 1);
            }

            const half = Math.floor(maxVisible / 2);
            let start = Math.max(1, current - half);
            let end = Math.min(total, start + maxVisible - 1);

            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
            }

            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        };

        const visiblePages = getVisiblePages(currentPage, totalPages);
        const hasPrevious = currentPage > 1;
        const hasNext = currentPage < totalPages;

        const prevIcon = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>`;

        const nextIcon = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>`;

        return `
            <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div class="flex flex-1 justify-between sm:hidden">
                    <button
                        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${!hasPrevious ? 'opacity-50 cursor-not-allowed' : ''} pagination-btn"
                        data-page="${hasPrevious ? currentPage - 1 : ''}"
                        ${!hasPrevious ? 'disabled' : ''}
                    >
                        Anterior
                    </button>
                    <button
                        class="relative ml-3 inline-flex items-center rounded-md cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${!hasNext ? 'opacity-50 cursor-not-allowed' : ''} pagination-btn"
                        data-page="${hasNext ? currentPage + 1 : ''}"
                        ${!hasNext ? 'disabled' : ''}
                    >
                        Siguiente
                    </button>
                </div>
                <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Página <span class="font-medium">${currentPage}</span> de <span class="font-medium">${totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${!hasPrevious ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-600'} pagination-btn"
                                data-page="${hasPrevious ? currentPage - 1 : ''}"
                                ${!hasPrevious ? 'disabled' : ''}
                            >
                                <span class="sr-only">Anterior</span>
                                ${prevIcon}
                            </button>

                            ${visiblePages.map(page => `
                                <button
                                    class="relative inline-flex items-center px-4 py-2 text-sm font-semibold cursor-pointer pagination-btn ${
                                        page === currentPage
                                            ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                    }"
                                    data-page="${page}"
                                >
                                    ${page}
                                </button>
                            `).join('')}

                            <button
                                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${!hasNext ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-600'} pagination-btn"
                                data-page="${hasNext ? currentPage + 1 : ''}"
                                ${!hasNext ? 'disabled' : ''}
                            >
                                <span class="sr-only">Siguiente</span>
                                ${nextIcon}
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    private showFormModal(form: FormData) {
        const modal = document.getElementById('form-modal');
        const modalName = document.getElementById('modal-name');
        const modalEmailContainer = document.getElementById('modal-email-container');
        const modalMessage = document.getElementById('modal-message');
        const modalDate = document.getElementById('modal-date');
        
        if (modalName) modalName.textContent = form.name;
        if (modalEmailContainer) {
            const copyToClipboardHTML = this.createCopyToClipboardHTML(form.email);
            modalEmailContainer.innerHTML = copyToClipboardHTML;
            
            // Initialize the copy functionality for the newly created element
            const copyElement = modalEmailContainer.querySelector('.copy-to-clipboard') as HTMLElement;
            if (copyElement) {
                this.initializeCopyToClipboardElement(copyElement);
            }
        }
        if (modalMessage) modalMessage.textContent = form.message;
        if (modalDate) modalDate.textContent = this.formatDate(form.createdAt);
        
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    showExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) {
            modal.classList.add('hidden');
            const dateFromInput = document.getElementById('export-date-from') as HTMLInputElement;
            const dateToInput = document.getElementById('export-date-to') as HTMLInputElement;
            const statusSelect = document.getElementById('export-status') as HTMLSelectElement;
            
            if (dateFromInput) dateFromInput.value = '';
            if (dateToInput) dateToInput.value = '';
            if (statusSelect) statusSelect.value = '';
        }
    }

    hideModal() {
        const modal = document.getElementById('form-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    private showLoading() {
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const formsTable = document.getElementById('forms-table');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (formsTable) formsTable.classList.add('hidden');
    }

    private showError(message: string) {
        console.error(message);
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private createCopyToClipboardHTML(text: string): string {
        const componentId = `copy-${Math.random().toString(36).substr(2, 9)}`;
        return `
            <span 
                id="${componentId}"
                class="copy-to-clipboard cursor-pointer inline-flex items-center text-sm text-gray-900"
                data-text="${this.escapeHtml(text)}"
                title="Clic para copiar al portapapeles"
            >
                <span class="copy-text">${this.escapeHtml(text)}</span>
                <svg class="copy-icon ml-2 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </span>
        `;
    }

    private initializeCopyToClipboardElement(copyElement: HTMLElement) {
        const componentId = copyElement.id;
        const tooltipId = `tooltip-${componentId}`;
        
        if (copyElement && !copyElement.dataset.initialized) {
            copyElement.dataset.initialized = 'true';
            
            copyElement.addEventListener('click', async (event) => {
                event.preventDefault();
                
                const textToCopy = copyElement.getAttribute('data-text');
                if (textToCopy) {
                    try {
                        await navigator.clipboard.writeText(textToCopy);
                        
                        // Visual feedback
                        copyElement.classList.add('copied');
                        
                        // Show tooltip at mouse position
                        this.showCopyTooltip((event as MouseEvent).clientX, (event as MouseEvent).clientY, tooltipId);
                        
                        // Remove feedback after 2 seconds
                        setTimeout(() => {
                            copyElement.classList.remove('copied');
                        }, 2000);
                        
                    } catch (err) {
                        console.error('Error copying to clipboard:', err);
                        
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        textArea.style.top = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        
                        try {
                            document.execCommand('copy');
                            copyElement.classList.add('copied');
                            
                            // Show tooltip at mouse position
                            this.showCopyTooltip((event as MouseEvent).clientX, (event as MouseEvent).clientY, tooltipId);
                            
                            setTimeout(() => {
                                copyElement.classList.remove('copied');
                            }, 2000);
                        } catch (fallbackErr) {
                            console.error('Fallback copy failed:', fallbackErr);
                        }
                        
                        document.body.removeChild(textArea);
                    }
                }
            });
        }
    }

    private showCopyTooltip(x: number, y: number, tooltipId: string) {
        // Look for existing tooltip or create one
        let tooltip = document.getElementById(tooltipId);
        
        if (!tooltip) {
            // Create tooltip if it doesn't exist
            tooltip = document.createElement('div');
            tooltip.id = tooltipId;
            tooltip.className = 'copy-tooltip';
            tooltip.textContent = '¡Copiado!';
            document.body.appendChild(tooltip);
        }
        
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y - 40}px`;
        tooltip.classList.add('show');
        
        setTimeout(() => {
            tooltip.classList.remove('show');
        }, 1500);
    }
}