import { useEffect } from 'react';
import { useRouter } from 'next/router';

import 'bootstrap/dist/css/bootstrap.min.css';

interface MyAppProps {
    Component: React.ComponentType<any>;
    pageProps: any;
}

function MyApp({ Component, pageProps }: MyAppProps) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token && router.pathname !== '/') {
            router.push('/');
        }
    }, [router.pathname]);

    return <Component {...pageProps} />;
}

export default MyApp;
