import { useEffect } from 'react';
import { useRouter } from 'next/router';

import 'bootstrap/dist/css/bootstrap.min.css';


function MyApp({ Component, pageProps }) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token && router.pathname !== '/') {
            router.push('/');
        }
    }, []);

    return <Component {...pageProps} />;
}

export default MyApp;
