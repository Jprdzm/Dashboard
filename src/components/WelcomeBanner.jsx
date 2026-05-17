import React from 'react';

export default function WelcomeBanner() {
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat('es-ES', dateOptions).format(new Date());

  // Capitalize first letter of the date for better aesthetics
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex flex-col space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-text-light dark:text-text-dark">
        Bienvenido, JP
      </h1>
      <p className="text-sm font-medium text-textMuted-light dark:text-textMuted-dark">
        {displayDate}
      </p>
    </div>
  );
}
