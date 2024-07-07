import { useRouter } from 'next/router';

interface LogoutButtonProps {
    onLogout: () => void; //  handle logout
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
    const router = useRouter();

    const handleLogout = () => {
        onLogout(); 
    };

    return (
        <button className="btn btn-primary" onClick={handleLogout}>
            Logout
        </button>
    );
};

export default LogoutButton;
