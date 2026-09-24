import { useCallback, useEffect, useState } from 'react';
import { comprobarServidorActivo } from '../config/consultas';

export type ServerStatus = 'checking' | 'starting' | 'ready' | 'unavailable';

const MAX_WAIT_MS = 5 * 60 * 1000;
const RETRY_INTERVAL_MS = 10000;

export const getServerStatusMessage = (status: ServerStatus) => {
    if (status === 'checking') return 'Comprobando disponibilidad del servidor...';
    if (status === 'starting') {
        return 'El servidor esta en reposo o apagado temporalmente. Lo estamos encendiendo; espera un momento. Reintentaremos automaticamente durante hasta 5 minutos.';
    }
    if (status === 'unavailable') {
        return 'El servidor aun no responde. Intenta nuevamente; si estaba apagado puede necesitar unos minutos adicionales para iniciar.';
    }
    return 'Servidor listo.';
};

export const useServerStatus = () => {
    const [status, setStatus] = useState<ServerStatus>('checking');
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        let timer: number | undefined;
        const startedAt = Date.now();

        const poll = async () => {
            const ready = await comprobarServidorActivo();

            if (cancelled) return;

            if (ready) {
                setStatus('ready');
                return;
            }

            if (Date.now() - startedAt >= MAX_WAIT_MS) {
                setStatus('unavailable');
                return;
            }

            setStatus('starting');
            timer = window.setTimeout(() => void poll(), RETRY_INTERVAL_MS);
        };

        void poll();

        return () => {
            cancelled = true;
            if (timer) window.clearTimeout(timer);
        };
    }, [retryKey]);

    const retry = useCallback(() => {
        setStatus('checking');
        setRetryKey((value) => value + 1);
    }, []);

    return { status, retry };
};
