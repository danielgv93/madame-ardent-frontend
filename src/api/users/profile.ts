import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

export const PUT: APIRoute = async ({ request }) => {
    try {
        const user = authenticateRequest(request);
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const { name, currentPassword, newPassword, notifications, weeklySummary } = body;

        // Validate required fields
        if (!name) {
            return new Response(JSON.stringify({ error: 'Name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { id: user.userId }
        });

        if (!currentUser) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const updateData: any = {
            name,
            // Store preferences in a JSON field or separate table if needed
            // For now, we'll just update basic user info
        };

        // Handle password change if provided
        if (currentPassword && newPassword) {
            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
            
            if (!isValidPassword) {
                return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Validate new password
            if (newPassword.length < 6) {
                return new Response(JSON.stringify({ error: 'New password must be at least 6 characters long' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });

        return new Response(JSON.stringify({ 
            message: 'Profile updated successfully',
            user: updatedUser
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        
        return new Response(JSON.stringify({ 
            error: 'Internal server error' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};