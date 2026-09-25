/**
 * The master key set. Every other language is checked against this file's keys
 * at build time (see `types.ts`), so a missing string is a TypeScript error
 * rather than a blank label on someone's phone.
 *
 * Keys ending in `_one` / `_other` are chosen by `t()` from `vars.count`.
 */
export const en = {
  // ---------------------------------------------------------------- common
  'common.save': 'Save',
  'common.saveChanges': 'Save changes',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.remove': 'Remove',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.back': 'Go back',
  'common.done': 'Done',
  'common.optional': 'Optional',
  'common.loading': 'Loading',
  'common.today': 'Today',
  'common.yesterday': 'Yesterday',
  'common.tomorrow': 'Tomorrow',
  'common.seeAll': 'See all',
  'common.all': 'All',
  'common.notNow': 'Not now',
  'common.change': 'Change',
  'common.enabled': 'On',
  'common.disabled': 'Off',
  'common.retry': 'Try again',
  'common.close': 'Close',

  // ------------------------------------------------------------ navigation
  'nav.home': 'Home',
  'nav.memories': 'Memories',
  'nav.routines': 'Routines',
  'nav.assistant': 'Assistant',
  'nav.profile': 'Profile',
  'nav.main': 'Main',

  // --------------------------------------------------------------- welcome
  'welcome.tagline1': 'Remember.',
  'welcome.tagline2': 'Plan.',
  'welcome.tagline3': 'Live Better.',
  'welcome.subtitle': 'Your personal memory and routine companion.',
  'welcome.getStarted': 'Get Started',
  'welcome.haveAccount': 'Already have an account?',
  'welcome.signIn': 'Sign in',
  'welcome.heroAlt': 'A cup of tea resting on an open book beside a soft knitted blanket',
  'welcome.opening': 'Opening DailyMind',

  // ------------------------------------------------------------------ home
  'home.greeting.morning': 'Good morning',
  'home.greeting.afternoon': 'Good afternoon',
  'home.greeting.evening': 'Good evening',
  'home.openProfile': 'Open your profile',
  'home.note.allDone': 'Everything on today is done. Rest easy.',
  'home.note.morning': 'A calmer day starts with small steps.',
  'home.note.afternoon': 'There is no hurry. The day is still yours.',
  'home.note.evening': 'A gentle end to the day is enough.',
  'home.todaysRoutine': "Today's routine",
  'home.askTitle': 'Ask DailyMind',
  'home.askHint': 'What do I need to do today?',
  'home.recentMemory': 'Recent memory',
  'home.emptyRoutines.title': 'Nothing scheduled',
  'home.emptyRoutines.body': 'Add the things you would like to keep doing each day.',

  // -------------------------------------------------------------- progress
  'progress.title': "Today's progress",
  'progress.completedOf': '{{completed}} of {{total}} completed',
  'progress.nothingScheduled': 'Nothing scheduled today',
  'progress.ariaLabel': 'Routine completion',

  // ---------------------------------------------------------- routine item
  'routineItem.markDone': 'Mark {{name}} as done',
  'routineItem.markNotDone': 'Mark {{name}} as not done',

  // -------------------------------------------------------------- memories
  'memories.title': 'Memories',
  'memories.search': 'Search memories',
  'memories.closeSearch': 'Close search',
  'memories.addMemory': 'Add a memory',
  'memories.searchPlaceholder': 'Search by title, person or tag',
  'memories.filterLabel': 'Filter memories',
  'memories.filter.all': 'All',
  'memories.filter.photos': 'Photos',
  'memories.filter.people': 'People',
  'memories.filter.events': 'Events',
  'memories.empty.noneTitle': 'No memories yet',
  'memories.empty.noneBody': 'Start capturing the moments you want to remember.',
  'memories.empty.noMatchTitle': 'Nothing matches yet',
  'memories.empty.noMatchBody':
    'Try a different word, or clear the filter to see everything you have saved.',
  'memories.clearFilters': 'Clear filters',
  'memories.addShort': 'Add memory',
  'memories.viewAll_one': 'View all {{count}} memory',
  'memories.viewAll_other': 'View all {{count}} memories',
  'memories.count_one': '{{count}} memory',
  'memories.count_other': '{{count}} memories',
  'memories.backToList': 'Back to list',
  'memories.category.photo': 'Photo',
  'memories.category.people': 'People',
  'memories.category.event': 'Event',

  // ----------------------------------------------------------- memory form
  'memoryForm.addTitle': 'Add memory',
  'memoryForm.editTitle': 'Edit memory',
  'memoryForm.addPhoto': 'Add a photo',
  'memoryForm.preparingPhoto': 'Preparing photo...',
  'memoryForm.removePhoto': 'Remove photo',
  'memoryForm.photoError': 'That photo could not be opened. Try a different one.',
  'memoryForm.title': 'Title',
  'memoryForm.titlePlaceholder': 'Evening at the lake',
  'memoryForm.titleRequired': 'A title helps you find this again later.',
  'memoryForm.date': 'Date',
  'memoryForm.description': 'Description',
  'memoryForm.descriptionPlaceholder': 'What happened, and how it felt.',
  'memoryForm.kind': 'Kind of memory',
  'memoryForm.people': 'People',
  'memoryForm.peoplePlaceholder': 'Who was there?',
  'memoryForm.addPerson': 'Add a person',
  'memoryForm.addPersonAction': 'Add person',
  'memoryForm.tags': 'Tags',
  'memoryForm.addTag': 'Add a tag',
  'memoryForm.addTagAction': 'Add tag',
  'memoryForm.saveMemory': 'Save memory',
  'memoryForm.savedToast': 'Memory saved',
  'memoryForm.updatedToast': 'Memory updated',

  // --------------------------------------------------------- memory detail
  'memoryDetail.edit': 'Edit memory',
  'memoryDetail.delete': 'Delete memory',
  'memoryDetail.with': 'With {{people}}',
  'memoryDetail.tags': 'Tags',
  'memoryDetail.noticedDate': 'DailyMind noticed a date in this memory.',
  'memoryDetail.reminderOffer': 'Would you like a reminder for {{date}}?',
  'memoryDetail.reminderOfferYears': 'Would you like a reminder for {{date}}, {{years}} years on?',
  'memoryDetail.createReminder': 'Create reminder',
  'memoryDetail.reminderSet': 'Reminder set',
  'memoryDetail.backToAll': 'Back to all memories',
  'memoryDetail.confirmReminderTitle': 'Create this reminder?',
  'memoryDetail.confirmReminderBody':
    'DailyMind will remind you about "{{title}}" on {{date}}. Nothing else changes, and you can remove it at any time.',
  'memoryDetail.confirmReminderYes': 'Yes, create reminder',
  'memoryDetail.confirmDeleteTitle': 'Delete this memory?',
  'memoryDetail.confirmDeleteBody': 'This removes it from DailyMind. It cannot be undone.',
  'memoryDetail.keepIt': 'Keep it',
  'memoryDetail.deletedToast': 'Memory deleted',
  'memoryDetail.reminderCreatedToast': 'Reminder created',
  'memoryDetail.reminderRemovedToast': 'Reminder removed',

  // -------------------------------------------------------------- routines
  'routines.title': 'Routines',
  'routines.goToToday': 'Go to today',
  'routines.addRoutine': 'Add a routine',
  'routines.previousWeek': 'Previous week',
  'routines.nextWeek': 'Next week',
  'routines.chooseDay': 'Choose a day',
  'routines.countOf': '{{completed}} of {{total}}',
  'routines.empty.title': 'Nothing on this day',
  'routines.empty.body': 'Routines you add will show up on the days they repeat.',
  'routines.addShort': 'Add routine',
  'routines.remindersSection': 'Reminders',
  'routines.insightsSection': 'Routine insights',
  'routines.insightsGood': 'Good consistency',
  'routines.insightsWeek': 'Your week so far',
  'routines.insightsBody': 'You have completed {{percent}}% of your morning routines this week.',
  'routines.insightsEmpty': 'Once you have a few days recorded, patterns will show up here.',

  // ---------------------------------------------------------- routine form
  'routineForm.addTitle': 'Add routine',
  'routineForm.editTitle': 'Edit routine',
  'routineForm.name': 'Routine name',
  'routineForm.namePlaceholder': 'Morning walk',
  'routineForm.nameRequired': 'Give the routine a name so you recognise it.',
  'routineForm.icon': 'Icon',
  'routineForm.time': 'Time',
  'routineForm.repeat': 'Repeat',
  'routineForm.chooseDay': 'Choose at least one day.',
  'routineForm.note': 'Note',
  'routineForm.noteHint': 'Optional. A short reminder to yourself.',
  'routineForm.notePlaceholder': 'After breakfast, with a full glass of water.',
  'routineForm.saveRoutine': 'Save routine',
  'routineForm.addedToast': 'Routine added',
  'routineForm.updatedToast': 'Routine updated',
  'routineForm.reminderLabel': 'Remind me at this time',
  'routineForm.reminderHint': 'A notification on this device when the routine is due.',

  // ---------------------------------------------------------- repeat rules
  'repeat.daily': 'Daily',
  'repeat.weekdays': 'Mon-Fri',
  'repeat.weekends': 'Weekends',
  'repeat.custom': 'Custom',
  'repeat.describe.daily': 'Every day',
  'repeat.describe.weekdays': 'Monday to Friday',
  'repeat.describe.weekends': 'Saturday and Sunday',
  'repeat.describe.none': 'No days selected',

  // ----------------------------------------------------------- icon labels
  'icon.walk': 'Walk',
  'icon.food': 'Food',
  'icon.pill': 'Medicine',
  'icon.phone': 'Call',
  'icon.book': 'Reading',
  'icon.heart': 'Wellbeing',
  'icon.water': 'Water',
  'icon.sun': 'Morning',
  'icon.moon': 'Evening',
  'icon.music': 'Music',

  // -------------------------------------------------------- routine detail
  'routineDetail.edit': 'Edit routine',
  'routineDetail.delete': 'Delete routine',
  'routineDetail.time': 'Time',
  'routineDetail.repeats': 'Repeats',
  'routineDetail.markDoneToday': 'Mark as done today',
  'routineDetail.completedToday': 'Completed today',
  'routineDetail.notToday': 'Not scheduled for today.',
  'routineDetail.lastTwoWeeks': 'Last two weeks',
  'routineDetail.completedOn':
    'Completed on {{completed}} of {{total}} scheduled days ({{percent}}%).',
  'routineDetail.dayCompleted': '{{date}}: completed',
  'routineDetail.dayMissed': '{{date}}: not completed',
  'routineDetail.dayNotScheduled': '{{date}}: not scheduled',
  'routineDetail.confirmDeleteTitle': 'Delete this routine?',
  'routineDetail.confirmDeleteBody':
    'It will be removed from your days, along with its completion history.',
  'routineDetail.keepIt': 'Keep it',
  'routineDetail.deletedToast': 'Routine deleted',

  // ------------------------------------------------------------- assistant
  'assistant.title': 'DailyMind Assistant',
  'assistant.inputPlaceholder': 'Ask anything...',
  'assistant.send': 'Send message',
  'assistant.askLabel': 'Ask DailyMind',
  'assistant.replying': 'DailyMind is replying',
  'assistant.error': 'Something went wrong reaching the assistant. Please try again.',
  'assistant.greeting':
    'Hello {{name}}. I am your DailyMind assistant. I can help you with your routines, memories and daily plans. What would you like to know?',
  'assistant.suggest.left': 'What is left today?',
  'assistant.suggest.memories': 'Show my memories',
  'assistant.suggest.yesterday': 'What did I do yesterday?',
  'assistant.suggest.week': 'What is my routine like this week?',
  'assistant.suggest.howAmIDoing': 'How am I doing this week?',
  'assistant.reply.remaining': 'Here are your remaining tasks today:',
  'assistant.reply.remainingFooter':
    'You have already completed {{done}} of your {{total}} routines.',
  'assistant.reply.allDone': 'Everything on today is done. That is the whole list.',
  'assistant.reply.allDoneFooter': 'All {{total}} routines completed.',
  'assistant.reply.nothingToday': 'You have nothing scheduled today.',
  'assistant.reply.addRoutine': 'Add a routine',
  'assistant.reply.noneCompleted':
    'Nothing is marked complete yet today. There is still plenty of day left.',
  'assistant.reply.completed': 'You have completed {{count}} of your routines today:',
  'assistant.reply.wholeDay': 'Here is your whole day, {{name}}:',
  'assistant.reply.wholeDayFooter': '{{completed}} of {{total}} completed so far.',
  'assistant.reply.doneSuffix': ' - done',
  'assistant.reply.tomorrowNothing': 'Nothing is scheduled for {{day}}.',
  'assistant.reply.tomorrow': '{{day}} looks like this:',
  'assistant.reply.yesterdayNothing': 'There was nothing scheduled yesterday.',
  'assistant.reply.yesterdayNone':
    'Nothing was marked complete yesterday. It may simply not have been recorded.',
  'assistant.reply.yesterday': 'Yesterday you completed {{done}} of {{total}} routines:',
  'assistant.reply.yesterdayMissed_one': '{{names}} was not marked complete.',
  'assistant.reply.yesterdayMissed_other': '{{names}} were not marked complete.',
  'assistant.reply.yesterdayAll': 'Everything scheduled was completed.',
  'assistant.reply.week':
    'Across this week you have completed {{completed}} of {{total}} scheduled routines, which is {{percent}}%.',
  'assistant.reply.weekMissed_one':
    '{{name}} was the one missed most often, on {{count}} day.',
  'assistant.reply.weekMissed_other':
    '{{name}} was the one missed most often, on {{count}} days.',
  'assistant.reply.openInsights': 'Open insights',
  'assistant.reply.memoriesNotFound': 'I could not find a memory about "{{query}}".',
  'assistant.reply.memoriesNone': 'There are no memories saved yet.',
  'assistant.reply.memoriesFound': 'Here is what I found about "{{query}}":',
  'assistant.reply.memoriesRecent': 'Here are some of your most recent memories:',
  'assistant.reply.seeAllMemories': 'See all memories',
  'assistant.reply.addMemory': 'Add a memory',
  'assistant.reply.insightsFallback':
    'You have completed {{percent}}% of your scheduled routines this week.',
  'assistant.reply.insightsFooter': 'These are observations from your own log, nothing more.',
  'assistant.reply.addMemoryHelp':
    'Of course. Tell it however you like - a title and a few lines is plenty, and you can add a photo if you have one.',
  'assistant.reply.addRoutineHelp':
    'Happy to help. Give it a name and a time, and choose how often it should repeat.',
  'assistant.reply.greetingBack':
    'Hello {{name}}. You have completed {{completed}} of {{total}} routines today.',
  'assistant.reply.thanks': 'Any time. I am here whenever you need me.',
  'assistant.reply.help':
    'I can look after the everyday things with you: what is still on today, what you did yesterday, how the week has gone, and the memories you have saved. I will never change anything without asking you first.',
  'assistant.reply.fallback':
    'I am not sure about that one yet. I can help with your routines for today, what you did on an earlier day, how your week has gone, and anything you have saved as a memory.',
  'assistant.reply.fallbackFooter': 'Your most recent memory is "{{title}}".',
  'assistant.reply.locationOn':
    'Your location is being shared with {{names}}. It was last updated {{when}}.',
  'assistant.reply.locationOff': 'Location sharing is currently off.',
  'assistant.reply.openLocation': 'Open location sharing',

  // -------------------------------------------------------------- insights
  'insights.title': 'Insights',
  'insights.choosePeriod': 'Choose a period',
  'insights.thisWeek': 'This week',
  'insights.fourWeeks': 'Four weeks',
  'insights.empty.title': 'Nothing to show yet',
  'insights.empty.body':
    'Once you have recorded a few days of routines, DailyMind will describe what it notices.',
  'insights.completed': 'Completed',
  'insights.routinesCount': '{{completed}} of {{total}} routines',
  'insights.chartTitle': 'Routine completion',
  'insights.chartAria': 'Routine completion by day',
  'insights.chartDay': '{{day}}: {{completed}} of {{total}} completed',
  'insights.mornings': 'Mornings',
  'insights.morningsCaption': 'of morning routines completed',
  'insights.fullDays': 'Full days',
  'insights.fullDaysCaption_one': '{{count}} day in a row with everything done',
  'insights.fullDaysCaption_other': '{{count}} days in a row with everything done',
  'insights.disclaimer':
    'These are plain observations from what you have recorded. They describe your routine, not your health.',
  'insights.rangeWeek': 'this week',
  'insights.rangeMonth': 'over the last four weeks',
  'insights.obs.morningGood': 'Good consistency',
  'insights.obs.morningGoodBody':
    'You completed {{percent}}% of your morning routines {{range}}.',
  'insights.obs.morningMixed': 'Mornings were mixed',
  'insights.obs.morningMixedBody':
    'You completed {{percent}}% of your morning routines {{range}}.',
  'insights.obs.trendUp': 'More completed than last time',
  'insights.obs.trendUpBody':
    'Overall completion was {{percent}}%, compared with {{previous}}% in the period before.',
  'insights.obs.trendDown': 'A change from your usual pattern',
  'insights.obs.trendDownBody':
    'Overall completion was {{percent}}%, compared with {{previous}}% in the period before. This is a description of your log, not a judgement.',
  'insights.obs.trendSteady': 'A steady stretch',
  'insights.obs.trendSteadyBody':
    'Overall completion was {{percent}}%, close to the {{previous}}% in the period before.',
  'insights.obs.mostMissed': '{{name}} was missed most often',
  'insights.obs.mostMissedBody_one':
    'It was not marked complete on {{count}} day {{range}}. You may want to move it to a different time.',
  'insights.obs.mostMissedBody_other':
    'It was not marked complete on {{count}} days {{range}}. You may want to move it to a different time.',

  // --------------------------------------------------------------- profile
  'profile.title': 'Profile',
  'profile.memoriesStat': 'Memories',
  'profile.sharingStat': 'Sharing with',
  'profile.personalInfo': 'Personal information',
  'profile.caregiverAccess': 'Caregiver access',
  'profile.privacy': 'Privacy and sharing',
  'profile.notifications': 'Notifications',
  'profile.location': 'Location sharing',
  'profile.language': 'Language',
  'profile.help': 'Help and support',
  'profile.activeCount': '{{count}} active',
  'profile.none': 'None',
  'profile.privacyNote':
    'Everything you write stays on this device. DailyMind only shares what you switch on yourself.',
  'profile.restoreSample': 'Restore the sample content',
  'profile.restoreTitle': 'Restore sample content?',
  'profile.restoreBody':
    'Your memories, routines and settings on this device will be replaced with the sample ones. This cannot be undone.',
  'profile.restoreConfirm': 'Restore sample content',
  'profile.restoredToast': 'Sample content restored',

  // ------------------------------------------------------- personal detail
  'personal.title': 'Personal information',
  'personal.name': 'Name',
  'personal.email': 'Email',
  'personal.emailHint': 'Used to identify you in DailyMind. It is not sent anywhere.',
  'personal.savedToast': 'Details saved',

  // -------------------------------------------------------------- language
  'language.title': 'Language',
  'language.intro': 'Choose the language DailyMind speaks to you in.',
  'language.changedToast': 'Language updated',
  'language.assistantNote':
    'The assistant will answer in this language too.',

  // --------------------------------------------------------------- helpers
  'help.title': 'Help and support',
  'help.gettingStarted': 'Getting started',
  'help.savingMemory': 'Saving a memory',
  'help.savingMemoryBody':
    'Open Memories and tap the plus. A title is all that is needed; a photo, people and tags are optional.',
  'help.markingRoutine': 'Marking a routine done',
  'help.markingRoutineBody':
    'Tap the circle beside it on Home or Routines. Tap it again to undo.',
  'help.askingAssistant': 'Asking the assistant',
  'help.askingAssistantBody': 'Ask in your own words, or tap one of the suggestions underneath.',
  'help.sharingFamily': 'Sharing with family',
  'help.sharingFamilyBody':
    'Caregiver access lets you choose exactly what each person can see.',
  'help.contact': 'Contact',
  'help.email': 'Email',
  'help.phoneHours': 'Mon to Fri, 9am to 6pm',
  'help.inApp': 'Inside the app',
  'help.askAssistant': 'Ask the assistant',

  // ------------------------------------------------------------ caregivers
  'caregivers.title': 'Caregiver access',
  'caregivers.add': 'Add a caregiver',
  'caregivers.intro':
    'Share selected information with trusted caregivers. You choose what each person can see, and you can turn any of it off at any time.',
  'caregivers.empty.title': 'No one has access',
  'caregivers.empty.body':
    'Nothing is shared until you invite someone and switch on what they can see.',
  'caregivers.active': 'Active',
  'caregivers.paused': 'Paused',
  'caregivers.sharingOn': 'Sharing is on',
  'caregivers.sharingOnBody': '{{name}} can see what is switched on below.',
  'caregivers.sharingOffBody': '{{name}} cannot see anything while this is off.',
  'caregivers.permissions': 'Sharing permissions',
  'caregivers.perm.routines': 'Routines and activities',
  'caregivers.perm.routinesBody': 'What is on each day, and what was completed.',
  'caregivers.perm.memories': 'Memories',
  'caregivers.perm.memoriesBody': 'The moments you have saved.',
  'caregivers.perm.insights': 'Routine insights',
  'caregivers.perm.insightsBody': 'Plain observations about your week.',
  'caregivers.perm.profile': 'Basic profile information',
  'caregivers.perm.profileBody': 'Your name and email.',
  'caregivers.perm.location': 'Live location',
  'caregivers.perm.locationBody': 'Your latest location, while location sharing is on.',
  'caregivers.removeAccess': 'Remove access',
  'caregivers.addTitle': 'Add a caregiver',
  'caregivers.addBody':
    'They start with the least access. You decide what to switch on afterwards.',
  'caregivers.nameLabel': 'Name',
  'caregivers.relationLabel': 'Relationship',
  'caregivers.emailLabel': 'Email',
  'caregivers.addConfirm': 'Add caregiver',
  'caregivers.addedToast': 'Caregiver added',
  'caregivers.removeTitle': 'Remove {{name}}?',
  'caregivers.removeBody': 'They will no longer be able to see anything from DailyMind.',
  'caregivers.removedToast': 'Access removed',
  'caregivers.viewDashboard': 'View their dashboard',
  'caregivers.defaultRelation': 'Caregiver',

  // --------------------------------------------------- caregiver dashboard
  'dashboard.title': 'Caregiver view',
  'dashboard.previewNotice':
    'This is what {{name}} sees. It is a preview on your own device - it is not a separate caregiver login.',
  'dashboard.person': 'Person',
  'dashboard.connected': 'Sharing active',
  'dashboard.paused': 'Sharing paused',
  'dashboard.dailyTasks': 'Daily tasks',
  'dashboard.completedCount': 'Completed {{completed}} of {{total}}',
  'dashboard.remainingCount_one': '{{count}} task remaining',
  'dashboard.remainingCount_other': '{{count}} tasks remaining',
  'dashboard.reminders': 'Reminders',
  'dashboard.nextReminder': 'Next reminder',
  'dashboard.noReminders': 'Nothing else scheduled today',
  'dashboard.location': 'Location',
  'dashboard.viewLocation': 'View location',
  'dashboard.notShared': 'Not shared with you',
  'dashboard.notSharedBody': '{{name}} has not switched this on.',

  // --------------------------------------------------------------- privacy
  'privacy.title': 'Privacy and sharing',
  'privacy.intro':
    'Nothing leaves this device unless you switch it on. DailyMind never shares a memory, a routine or an observation on its own.',
  'privacy.sharingSection': 'Sharing',
  'privacy.allowSharing': 'Allow caregiver sharing',
  'privacy.allowSharingBody':
    'Turning this off pauses sharing for everyone at once, without changing their individual settings.',
  'privacy.whoHasAccess': 'Who has access',
  'privacy.noOne': 'No one at the moment',
  'privacy.whereSection': 'Where your information lives',
  'privacy.onDevice': 'On this device',
  'privacy.onDeviceBody':
    "Memories, routines and completions are stored in this browser. Clearing the browser's data removes them.",
  'privacy.nothingSent': 'Nothing is sent away',
  'privacy.nothingSentBody':
    'There is no account and no upload in this version. The assistant answers from what is already on the device.',

  // --------------------------------------------------------- notifications
  'notifications.title': 'Notifications',
  'notifications.allow': 'Allow notifications',
  'notifications.allowBody': 'DailyMind can remind you when a routine is due.',
  'notifications.permissionNeeded': 'Notifications are turned off',
  'notifications.permissionNeededBody':
    'DailyMind needs permission to show reminders on this device.',
  'notifications.grant': 'Turn on notifications',
  'notifications.denied': 'Notifications are blocked',
  'notifications.deniedBody':
    'Notifications were declined. You can turn them back on in your device settings for DailyMind.',
  'notifications.unsupported': 'Reminders are not available on this device.',
  'notifications.unsupportedBody':
    'This browser cannot show scheduled reminders. Everything else works as usual.',
  'notifications.routineReminders': 'Routine reminders',
  'notifications.routineRemindersBody': 'A quiet nudge at the time a routine is due.',
  'notifications.dailySummary': 'Daily summary',
  'notifications.dailySummaryBody': 'One message each morning with what is on for the day.',
  'notifications.summaryTime': 'Summary time',
  'notifications.memoryPrompts': 'Memory prompts',
  'notifications.memoryPromptsBody': 'An occasional invitation to write something down.',
  'notifications.eveningCheck': 'Evening check-in',
  'notifications.eveningCheckBody': 'A reminder of anything still unfinished.',
  'notifications.eveningTime': 'Check-in time',
  'notifications.perRoutine': 'Reminders for each routine',
  'notifications.perRoutineBody':
    'Turn reminders on or off for individual routines. Times come from the routine itself.',
  'notifications.scheduled_one': '{{count}} reminder scheduled',
  'notifications.scheduled_other': '{{count}} reminders scheduled',
  'notifications.testReminder': 'Send a test reminder',
  'notifications.testSent': 'Test reminder sent',
  'notifications.webLimitation':
    'On the web, reminders only appear while DailyMind is open. Installed on Android, they arrive even when the app is closed.',

  // ------------------------------------------- notification message content
  'notify.routineTitle': 'Task reminder',
  'notify.routineBody': 'It is time to {{name}}.',
  'notify.summaryTitle': 'DailyMind reminder',
  'notify.summaryBody_one': 'Good morning. You have {{count}} task today.',
  'notify.summaryBody_other': 'Good morning. You have {{count}} tasks today.',
  'notify.summaryBodyNone': 'Good morning. Nothing is scheduled today.',
  'notify.eveningTitle': 'Daily task',
  'notify.eveningBody_one': 'You still have {{count}} task remaining today.',
  'notify.eveningBody_other': 'You still have {{count}} tasks remaining today.',
  'notify.eveningBodyNone': 'Everything on today is done. Well done.',
  'notify.testTitle': 'DailyMind reminder',
  'notify.testBody': 'This is how your reminders will look.',

  // -------------------------------------------------------------- location
  'location.title': 'Location sharing',
  'location.intro':
    'Share your latest location with a caregiver you trust, so they can check you are alright.',
  'location.status': 'Status',
  'location.sharing': 'Sharing location',
  'location.notSharing': 'Not sharing location',
  'location.sharedWith': 'Shared with',
  'location.sharedWithNobody': 'No one yet',
  'location.lastUpdated': 'Last updated',
  'location.never': 'Not updated yet',
  'location.startSharing': 'Start sharing',
  'location.stopSharing': 'Stop sharing',
  'location.updateNow': 'Update now',
  'location.updating': 'Getting your location...',
  'location.startedToast': 'Location sharing on',
  'location.stoppedToast': 'Location sharing off',
  'location.updatedToast': 'Location updated',
  'location.accuracy': 'Accuracy',
  'location.accuracyValue': '±{{metres}} m',
  'location.coordinates': 'Coordinates',
  'location.permissionTitle': 'Location permission needed',
  'location.permissionBody':
    'DailyMind needs location permission to share your location with your caregiver.',
  'location.permissionGrant': 'Allow location',
  'location.permissionDenied': 'Location permission was declined',
  'location.permissionDeniedBody':
    'Without permission DailyMind cannot share your location. You can allow it in your device settings for DailyMind.',
  'location.unavailable': 'Location unavailable',
  'location.unavailableBody':
    'Your device could not provide a location just now. Please try again in a moment.',
  'location.unsupported': 'This device cannot share location.',
  'location.offline': 'Waiting for network...',
  'location.whoCanSee': 'Who can see your location',
  'location.noCaregiverWithAccess':
    'No caregiver has location access yet. Switch on Live location for someone in Caregiver access.',
  'location.howItWorks': 'How it works',
  'location.howItWorksBody':
    'DailyMind records your location while the app is open, and only when you have moved a meaningful distance. It keeps the latest position, not a trail of where you have been.',
  'location.updateFrequency': 'Update frequency',
  'location.freq.balanced': 'Balanced',
  'location.freq.balancedBody': 'Every 5 minutes, or when you move 100 m. Recommended.',
  'location.freq.frequent': 'More often',
  'location.freq.frequentBody': 'Every 2 minutes, or when you move 50 m. Uses more battery.',
  'location.freq.saver': 'Battery saver',
  'location.freq.saverBody': 'Every 15 minutes, or when you move 250 m.',

  // ------------------------------------------------- caregiver location view
  'locationView.title': 'Location',
  'locationView.personLocation': "{{name}}'s location",
  'locationView.active': 'Location sharing active',
  'locationView.stale': 'Location last updated {{when}}',
  'locationView.disabled': 'Location sharing disabled',
  'locationView.unavailable': 'Location unavailable',
  'locationView.noAccess': 'You do not have access to this location',
  'locationView.noAccessBody':
    'Live location is not switched on for this caregiver. It can be turned on in Caregiver access.',
  'locationView.openInMaps': 'Open in maps',
  'locationView.mapUnavailable': 'The map could not be loaded. The coordinates are below.',
  'locationView.refresh': 'Refresh',
  'locationView.mapAlt': 'Map showing the last shared location',

  // ------------------------------------------------------- relative time
  'time.justNow': 'just now',
  'time.minutesAgo_one': '{{count}} minute ago',
  'time.minutesAgo_other': '{{count}} minutes ago',
  'time.hoursAgo_one': '{{count}} hour ago',
  'time.hoursAgo_other': '{{count}} hours ago',
  'time.daysAgo_one': '{{count}} day ago',
  'time.daysAgo_other': '{{count}} days ago',

  // ---------------------------------------------------------------- errors
  'error.generic': 'Something did not work. Please try again.',
  'error.network': "We couldn't reach the network. Please check your connection.",
  'error.locationUpdate':
    "We couldn't update your location. Please check your internet connection.",
  'error.notificationSchedule': 'That reminder could not be scheduled.',
  'error.unauthorized': 'You do not have permission to see this.',
  'error.invalidTime': 'Please choose a valid time.',
  'error.translationsFailed': 'Some text could not be loaded, so English is being shown.',
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;
