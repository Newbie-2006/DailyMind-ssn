import { useMemo, useState } from 'react';
import { BellPlus, CalendarDays, Pencil, Trash2, Users } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { anniversaryWithin, categoryLabel } from '../services/memoryService';
import { formatDateLong } from '../utils/date';
import { listToSentence } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { MemoryImage } from '../components/MemoryImage';
import { Button, IconButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';

export function MemoryDetails() {
  const { memoryId } = useParams<{ memoryId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { memories, reminders, actions } = useAppData();
  const { t } = useTranslation();

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
    notify(t('memoryDetail.reminderCreatedToast'));
  };

  const removeMemory = () => {
    actions.deleteMemory(memory.id);
    setConfirmingDelete(false);
    notify(t('memoryDetail.deletedToast'));
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
            <IconButton label={t('memoryDetail.edit')} onClick={() => navigate(`/memories/${memory.id}/edit`)}>
              <Pencil size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
            <IconButton label={t('memoryDetail.delete')} onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
          </>
        }
      />

      <div className="dm-gutter">
        <MemoryImage
          src={memory.image}
          alt={memory.title}
          priority
          className="h-60 w-full"
          rounded="rounded-card"
        />
      </div>

      <div className="dm-gutter space-y-6 pt-6">
        <div>
          <span className="inline-flex rounded-full bg-sage-wash px-2.5 py-1 text-[0.75rem] text-forest-soft">
            {categoryLabel(memory.category, t)}
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
            <span>{t('memoryDetail.with', { people: listToSentence(memory.people) })}</span>
          </p>
        ) : null}

        {memory.tags.length > 0 ? (
          <div>
            <h3 className="mb-2 text-[0.8125rem] font-medium text-ink-soft">
              {t('memoryDetail.tags')}
            </h3>
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
          <Card surface="sage" className="px-5 py-5">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest-soft"
              >
                <BellPlus size={17} strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] leading-relaxed text-forest-deep">
                  {t('memoryDetail.noticedDate')}
                </p>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft">
                  {anniversary.years > 0
                    ? t('memoryDetail.reminderOfferYears', {
                        date: formatDateLong(anniversary.date),
                        years: anniversary.years,
                      })
                    : t('memoryDetail.reminderOffer', {
                        date: formatDateLong(anniversary.date),
                      })}
                </p>
                <Button
                  variant="primary"
                  className="mt-3.5"
                  onClick={() => setConfirmingReminder(true)}
                >
                  {t('memoryDetail.createReminder')}
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
              <span className="block text-[0.875rem] text-ink">
                {t('memoryDetail.reminderSet')}
              </span>
              <span className="block text-[0.8125rem] text-ink-faint">
                {formatDateLong(existingReminder.date)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                actions.deleteReminder(existingReminder.id);
                notify(t('memoryDetail.reminderRemovedToast'));
              }}
              className="tap min-h-10 shrink-0 rounded-full px-3 text-[0.8125rem] font-medium text-ink-soft active:bg-surface-sunk"
            >
              {t('common.remove')}
            </button>
          </Card>
        ) : null}

        <Link
          to="/memories"
          className="tap block text-center text-[0.875rem] font-medium text-forest underline-offset-4 hover:underline"
        >
          {t('memoryDetail.backToAll')}
        </Link>
      </div>

      <Modal
        open={confirmingReminder}
        onClose={() => setConfirmingReminder(false)}
        title={t('memoryDetail.confirmReminderTitle')}
        description={
          anniversary
            ? t('memoryDetail.confirmReminderBody', {
                title: memory.title,
                date: formatDateLong(anniversary.date),
              })
            : ''
        }
        actions={
          <>
            <Button size="lg" onClick={createReminder}>
              {t('memoryDetail.confirmReminderYes')}
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingReminder(false)}>
              {t('common.notNow')}
            </Button>
          </>
        }
      />

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={t('memoryDetail.confirmDeleteTitle')}
        description={t('memoryDetail.confirmDeleteBody')}
        actions={
          <>
            <Button size="lg" onClick={removeMemory}>
              {t('memoryDetail.delete')}
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingDelete(false)}>
              {t('memoryDetail.keepIt')}
            </Button>
          </>
        }
      />
    </div>
  );
}
