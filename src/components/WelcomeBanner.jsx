import { useAuth } from '../services/AuthContext';

export default function WelcomeBanner() {
  const { user } = useAuth();
  const displayName = user?.email
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)
    : 'Usuario';

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat('es-ES', dateOptions).format(new Date());
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex flex-col space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-text-light dark:text-text-dark">
        Bienvenido, {displayName}
      </h1>
      <p className="text-sm font-medium text-textMuted-light dark:text-textMuted-dark">
        {displayDate}
      </p>
    </div>
  );
}
