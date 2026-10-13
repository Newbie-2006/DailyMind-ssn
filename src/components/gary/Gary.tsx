import { useCallback, useState } from 'react';
import { Mic } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGary } from '../../hooks/useGary';
import { GaryOverlay } from './GaryOverlay';

/** Form screens keep their own buttons clear; Gary waits until they are done. */
const HIDDEN_ON = /\/(new|edit)$/;

/**
 * The "Talk to Gary" button on every screen, and the Gary view it opens.
 *
 * Gary's state lives here rather than in the view, so stepping out to look at
 * a memory and coming back keeps the conversation.
 */
export function Gary() {
  const [open, setOpen] = useState(false);
  const gary = useGary(open);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const close = useCallback(() => setOpen(false), []);

  const openMemory = useCallback(
    (memoryId: string) => {
      setOpen(false);
      navigate(`/memories/${memoryId}`);
    },
    [navigate],
  );

  const openSetup = useCallback(() => {
    setOpen(false);
    navigate('/profile/gary');
  }, [navigate]);

  // The assistant screen pins a message box to the bottom; sit above it.
  const raised = pathname === '/assistant';

  return (
    <>
      {!open && !HIDDEN_ON.test(pathname) ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`tap absolute right-4 z-40 inline-flex min-h-14 items-center gap-2.5 rounded-full bg-forest py-2 pr-5 pl-2 text-canvas shadow-lift transition-transform duration-150 active:scale-95 ${
            raised
              ? 'bottom-[calc(10.5rem+env(safe-area-inset-bottom))]'
              : 'bottom-[calc(5rem+env(safe-area-inset-bottom))]'
          }`}
        >
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-forest-soft">
            <Mic size={21} strokeWidth={2.1} />
          </span>
          <span className="text-[1.0625rem] font-semibold">{gary.text.launch}</span>
        </button>
      ) : null}

      {open ? (
        <GaryOverlay gary={gary} onClose={close} onOpenMemory={openMemory} onOpenSetup={openSetup} />
      ) : null}
    </>
  );
}
