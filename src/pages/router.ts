import { useState, useEffect } from 'react';

let currentPath = window.location.pathname;
let listeners: Array<() => void> = [];

export function navigate(path: string) {
  currentPath = path;
  window.history.pushState({}, '', path);
  listeners.forEach(listener => listener());
}

export function useNavigate() {
  return navigate;
}

export function useLocation() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const listener = () => {
      setPath(window.location.pathname);
    };
    listeners.push(listener);

    const handlePopState = () => {
      currentPath = window.location.pathname;
      listeners.forEach(l => l());
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      listeners = listeners.filter(l => l !== listener);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return path;
}

export function useParams() {
  const path = useLocation();
  return {
    id: path.split('/').pop() || '',
  };
}
