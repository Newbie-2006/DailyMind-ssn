import { useMemo, useState } from 'react';
import { BellPlus, CalendarDays, Pencil, Trash2, Users } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { anniversaryWithin, categoryLabel } from '../services/memoryService';
import { formatDateLong, formatRelativeDay } from '../utils/date';
import { listToSentence } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { MemoryImage } from '../components/MemoryImage';
import { Button, IconButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/toastContext';

export function MemoryDetails() {
  const { memoryId } = useParams<{ memoryId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { memories, reminders, actions } = useAppData();

  const [confirmingReminder, setConfirmingReminder] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const memory = memories.find((item) => item.id === memoryId);

  const anniversary = useMemo(
    () => (memory ? anniversaryWithin(memory) : null),
    [memory],
  );

  const existingReminder = reminders.find((reminder) => reminder.memoryId === memoryId);

  if (!memory) return <Navigate to="/memories" replace />;

  const createReminder = () => {
    if (!anniversary) return;
    actions.addReminder({
      title: memory.title,
      date: anniversary.date,
      memoryId: memory.id,
    });
    setConfirmingReminder(false);
    notify('Reminder created');
  };

  const removeMemory = () => {
    actions.deleteMemory(memory.id);
    setConfirmingDelete(false);
    notify('Memory deleted');
    navigate('/memories', { replace: true });
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={memory.title}
        onBack
        fallbackTo="/memories"
        actions={
          <>
            <IconButton label="Edit memory" onClick={() => navigate(`/memories/${memory.id}/edit`)}>
              <Pencil size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
            <IconButton label="Delete memory" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
          </>
        }
      />

      <div className="px-5">
        <MemoryImage
          src={memory.image}
          alt={memory.title}
          priority
          className="h-60 w-full"
          rounded="rounded-card"
        />
      </div>

      <div className="space-y-6 px-5 pt-5">
        <div>
          <span className="inline-flex rounded-full bg-sage-wash px-2.5 py-1 text-[0.75rem] text-forest-soft">
            {categoryLabel(memory.category)}
          </span>
          <h2 className="mt-3 font-display text-[1.625rem] leading-tight tracking-[-0.015em] text-ink">
            {memory.title}
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] text-ink-soft">
            <CalendarDays size={15} strokeWidth={1.7} aria-hidden="true" />
            {formatDateLong(memory.date)}
          </p>
        </div>

        {memory.description ? (
          <p className="text-[0.9375rem] leading-[1.7] text-ink-soft">{memory.description}</p>
        ) : null}

        {memory.people.length > 0 ? (
          <p className="flex items-start gap-2 text-[0.875rem] text-ink-soft">
            <Users size={16} strokeWidth={1.7} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>With {listToSentence(memory.people)}</span>
          </p>
        ) : null}

        {memory.tags.length > 0 ? (
          <div>
            <h3 className="mb-2 text-[0.8125rem] font-medium text-ink-soft">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        ) : null}

        {/*
          DailyMind notices something and offers. It never creates the reminder
          on its own - the person has to say yes.
        */}
        {anniversary && !existingReminder ? (
          <Card surface="sage" className="px-5 py-4.5">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest-soft"
              >
                <BellPlus size={17} strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] leading-relaxed text-forest-deep">
                  DailyMind noticed a date in this memory.
                </p>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft">
                  Would you like a reminder for {formatRelativeDay(anniversary.date)}
                  {anniversary.years > 0 ? `, ${anniversary.years} years on` : ''}?
                </p>
                <Button
                  variant="primary"
                  className="mt-3.5"
                  onClick={() => setConfirmingReminder(true)}
                >
                  Create reminder
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {existingReminder ? (
          <Card className="flex items-center gap-3 px-4 py-3.5">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
            >
              <BellPlus size={17} strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.875rem] text-ink">Reminder set</span>
              <span className="block text-[0.8125rem] text-ink-faint">
                {formatDateLong(existingReminder.date)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                actions.deleteReminder(existingReminder.id);
                notify('Reminder removed');
              }}
              className="tap min-h-10 shrink-0 rounded-full px-3 text-[0.8125rem] font-medium text-ink-soft active:bg-surface-sunk"
            >
              Remove
            </button>
          </Card>
        ) : null}

        <Link
          to="/memories"
          className="tap block text-center text-[0.875rem] font-medium text-forest underline-offset-4 hover:underline"
        >
          Back to all memories
        </Link>
      </div>

      <Modal
        open={confirmingReminder}
        onClose={() => setConfirmingReminder(false)}
        title="Create this reminder?"
        description={
          anniversary
            ? `DailyMind will remind you about "${memory.title}" on ${formatDateLong(anniversary.date)}. Nothing else changes, and you can remove it at any time.`
            : ''
        }
        actions={
          <>
            <Button size="lg" onClick={createReminder}>
              Yes, create reminder
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingReminder(false)}>
              Not now
            </Button>
          </>
        }
      />

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete this memory?"
        description="This removes it from DailyMind. It cannot be undone."
        actions={
          <>
            <Button size="lg" onClick={removeMemory}>
              Delete memory
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingDelete(false)}>
              Keep it
            </Button>
          </>
        }
      />
    </div>
  );
}
