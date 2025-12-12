import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const CustomToast = () => {
    return (
        <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="rounded-xl shadow-lg border border-slate-100 font-sans"
        />
    );
};

export const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const content = (
        <div className="flex flex-col gap-1">
            <h4 className="font-bold text-sm text-slate-900">{title}</h4>
            <p className="text-xs text-slate-600">{message}</p>
        </div>
    );

    const options = {
        icon: type === 'success' ? <CheckCircle className="text-emerald-500" /> :
            type === 'warning' ? <AlertTriangle className="text-amber-500" /> :
                type === 'error' ? <AlertTriangle className="text-red-500" /> :
                    <Bell className="text-blue-500" />
    };

    switch (type) {
        case 'success':
            toast.success(content, options);
            break;
        case 'error':
            toast.error(content, options);
            break;
        case 'warning':
            toast.warning(content, options);
            break;
        default:
            toast.info(content, options);
    }
};
