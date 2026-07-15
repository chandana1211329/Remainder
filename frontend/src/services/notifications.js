// Browser Notification Service using Web Notifications API

export const notificationService = {
  // Request notification permission from the browser
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Display a native browser notification
  send: (title, body) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Play a gentle notify sound if desired, or just create the Notification
    try {
      new Notification(title, {
        body,
        icon: '/favicon.svg',
        tag: 'study-companion-alert'
      });
    } catch (e) {
      console.error('Failed to trigger notification:', e);
    }
  },

  // Schedules routine checks against configurable user settings
  startScheduler: (userSettings, dailyTask, nextRevision, nextAssignment) => {
    if (!userSettings) return null;

    // Check every 60 seconds
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHourMin = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
      const todayStr = now.toISOString().split('T')[0];

      // Retrieve sent notifications history to prevent duplicates
      const storageKey = `sent_notif_${todayStr}`;
      const sentList = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const triggerReminder = (key, title, body) => {
        if (!sentList.includes(key)) {
          notificationService.send(title, body);
          sentList.push(key);
          localStorage.setItem(storageKey, JSON.stringify(sentList));
        }
      };

      // 1. Morning Reminder (at wake-up time)
      if (userSettings.notifyMorning && userSettings.wakeupTime === currentHourMin) {
        triggerReminder('morning', '☀️ Good Morning!', 'Time to wake up and check off your morning habits!');
      }

      // 2. Exercise Reminders (Morning/Evening)
      if (userSettings.notifyExercise) {
        if (userSettings.morningExerciseTime === currentHourMin && !dailyTask?.morningExCompleted) {
          triggerReminder('morningEx', '🏋️ Morning Exercise Time', 'Time for your morning workout to stay active!');
        }
        if (userSettings.eveningExerciseTime === currentHourMin && !dailyTask?.eveningExCompleted) {
          triggerReminder('eveningEx', '🏃 Evening Exercise Time', 'Do not forget your evening exercise check-in!');
        }
      }

      // 3. Dinner Reminder
      if (userSettings.notifyDinner && userSettings.dinnerTime === currentHourMin && !dailyTask?.dinnerCompleted) {
        triggerReminder('dinner', '🍽️ Dinner Time', 'Dinner is served. Log your completion on the dashboard!');
      }

      // 4. Sleep Reminder (30 minutes before sleep target)
      if (userSettings.notifySleep && userSettings.sleepTime) {
        // Calculate 30 minutes before sleep target
        const [sleepH, sleepM] = userSettings.sleepTime.split(':').map(Number);
        const sleepDate = new Date();
        sleepDate.setHours(sleepH, sleepM, 0, 0);
        
        const warningDate = new Date(sleepDate.getTime() - 30 * 60 * 1000);
        const warningHourMin = warningDate.toTimeString().split(' ')[0].substring(0, 5);

        if (warningHourMin === currentHourMin && !dailyTask?.sleepCompleted) {
          triggerReminder('sleepWarning', '🌙 Wind Down Reminder', 'Your target sleep time is in 30 minutes. Time to log out!');
        }
      }

      // 5. Study Roadmap Reminder (at 10:00 AM)
      if (userSettings.notifyStudy && currentHourMin === '10:00' && !dailyTask?.jsCompleted) {
        triggerReminder('studyJS', '📚 Study Roadmap Alert', "Have you unlocked today's JavaScript topic yet? Check in!");
      }

      // 6. Assignment Reminder (at 03:00 PM if deadline is tomorrow)
      if (userSettings.notifyAssignment && currentHourMin === '15:00' && nextAssignment && !dailyTask?.assignmentCompleted) {
        const deadline = new Date(nextAssignment.deadline);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (deadline.toDateString() === tomorrow.toDateString()) {
          triggerReminder('assignment', '⚠️ Assignment Due Tomorrow', `"${nextAssignment.name}" is due tomorrow! Make sure to log progress.`);
        }
      }

      // 7. Revision Reminder (at 11:00 AM if revisions are due)
      if (userSettings.notifyRevision && currentHourMin === '11:00' && nextRevision) {
        triggerReminder('revision', '🔄 Spaced Revision Due', `You have revisions due today, including: "${nextRevision.topicTitle}".`);
      }

    }, 60000);

    return () => clearInterval(intervalId);
  }
};
