
// import { useEffect } from 'react';
// import { useRouter } from 'next/router';

// const withAuth = (WrappedComponent: React.ComponentType) => {
//     const AuthenticatedComponent = (props: any) => {
//         const router = useRouter();

//         useEffect(() => {
//             const token = localStorage.getItem('token');
//             if (!token) {
//                 router.push('/');
//             }
//         }, [router]);

//         return <WrappedComponent {...props} />;
//     };

//     return AuthenticatedComponent;
// };

// export default withAuth;
