import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function AdminPage() {
    const session = await auth();

    if (session) {
        redirect('/admin/dashboard');
    } else {
        redirect('/admin/login');
    }
}