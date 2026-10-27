import { useEffect, useRef } from 'react';
export function useModalFocus(open: boolean) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        if (!open || !ref.current) return;
        const dialog = ref.current, previous = document.activeElement as HTMLElement | null;
        dialog.focus();
        function key(event: KeyboardEvent) {
            if (event.key !== 'Tab') return;
            const nodes = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary')].filter(el => el.getClientRects().length > 0);
            const first = nodes[0], last = nodes.at(-1);
            if (!first) { event.preventDefault(); dialog.focus(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last!.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
        }
        dialog.addEventListener('keydown', key);
        return () => { dialog.removeEventListener('keydown', key); if (previous?.isConnected) previous.focus(); };
    }, [open]);
    return ref;
}
