import { useState, useEffect, useRef } from 'react';
import { Task, ChecklistItem } from '../types';
import { auth, db, initializeFirebaseConnection, isIframed, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc as firebaseSetDoc, deleteDoc } from 'firebase/firestore';

const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
};

const setDoc = async (documentRef: any, data: any, options?: any) => {
  const sanitizedData = sanitizeForFirestore(data);
  if (options) {
    return firebaseSetDoc(documentRef, sanitizedData, options);
  }
  return firebaseSetDoc(documentRef, sanitizedData);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Demo Seed Data (Section 12 of the Brief)
const DEMO_TASKS: Task[] = [
  {
    id: "demo-task-1",
    title: "Submit final project report",
    deadline_iso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    deadline_human: "Tomorrow · 11:59 PM",
    estimated_minutes: 120,
    difficulty: "hard",
    urgency: "critical",
    category: "work",
    priority_score: 9,
    calendar_conflict: "Professor meeting",
    reasoning: "High priority due to imminent academic deadline and time block density.",
    status: "active",
    created_at: new Date().toISOString(),
    checklist: [
      { id: "c1-1", step: "Find all research notes", minutes: 5, is_done: true },
      { id: "c1-2", step: "Write methodology section", minutes: 30, is_done: false },
      { id: "c1-3", step: "Add data charts", minutes: 40, is_done: false },
      { id: "c1-4", step: "Proofread and submit", minutes: 20, is_done: false }
    ],
    starred: true,
    list: "My Tasks"
  },
  {
    id: "demo-task-2",
    title: "Prepare client presentation deck",
    deadline_iso: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // in 2 days
    deadline_human: "In 2 days · 3:00 PM",
    estimated_minutes: 90,
    difficulty: "medium",
    urgency: "high",
    category: "work",
    priority_score: 7,
    calendar_conflict: null,
    reasoning: "Requires deep focus blocks. Schedules well during morning high-productivity hours.",
    status: "active",
    created_at: new Date().toISOString(),
    checklist: [
      { id: "c2-1", step: "Review client brief", minutes: 10, is_done: false },
      { id: "c2-2", step: "Create slide outline", minutes: 15, is_done: false },
      { id: "c2-3", step: "Design 8 slides", minutes: 45, is_done: false },
      { id: "c2-4", step: "Rehearse once", minutes: 20, is_done: false }
    ],
    starred: false,
    list: "My Tasks"
  },
  {
    id: "demo-task-3",
    title: "Pay electricity bill",
    deadline_iso: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days
    deadline_human: "In 4 days · 5:00 PM",
    estimated_minutes: 5,
    difficulty: "easy",
    urgency: "later",
    category: "finance",
    priority_score: 4,
    calendar_conflict: null,
    reasoning: "Quick operational task. Highly low effort and low threat profile.",
    status: "active",
    created_at: new Date().toISOString(),
    checklist: [
      { id: "c3-1", step: "Open payment app", minutes: 1, is_done: false },
      { id: "c3-2", step: "Enter bill amount", minutes: 2, is_done: false },
      { id: "c3-3", step: "Confirm payment", minutes: 2, is_done: false }
    ],
    starred: false,
    list: "My Tasks"
  },
  {
    id: "completed-demo-1",
    title: "Book train tickets for weekend hike",
    deadline_iso: new Date().toISOString(),
    deadline_human: "Today · Completed",
    estimated_minutes: 15,
    difficulty: "easy",
    urgency: "later",
    category: "personal",
    priority_score: 3,
    calendar_conflict: null,
    reasoning: "Simple logistics.",
    status: "done",
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    checklist: [
      { id: "c4-1", step: "Check train schedules", minutes: 5, is_done: true },
      { id: "c4-2", step: "Purchase premium seats", minutes: 10, is_done: true }
    ],
    starred: false,
    list: "My Tasks"
  }
];

// Global in-memory cache for Google Calendar access token
let globalAccessToken: string | null = null;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accessToken, setAccessTokenState] = useState<string | null>(globalAccessToken);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<string>("");
  const [aiStepsHistory, setAiStepsHistory] = useState<string[]>([]);
  const [lists, setLists] = useState<string[]>(["My Tasks", "Hackathon Tasks", "Personal Inbox"]);
  const [activeList, setActiveList] = useState<string>("My Tasks");
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'week' | 'starred' | 'dayplan' | 'habits'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [isFirebase, setIsFirebase] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem("pulse_is_guest") === "true";
  });

  const setAccessToken = (token: string | null) => {
    globalAccessToken = token;
    setAccessTokenState(token);
  };

  const [isSyncingGoogleTasks, setIsSyncingGoogleTasks] = useState<boolean>(false);
  const [googleTasksError, setGoogleTasksError] = useState<string | null>(null);
  const [googleCalendarError, setGoogleCalendarError] = useState<string | null>(null);
  const syncingTasksRef = useRef<Set<string>>(new Set());

  const syncGoogleTasks = async () => {
    if (!globalAccessToken) {
      console.log("No Google Tasks access token cached. Skipping Google Tasks sync.");
      return;
    }
    setIsSyncingGoogleTasks(true);

    try {
      // 1. Fetch Google Task Lists
      const listsRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        headers: { "Authorization": `Bearer ${globalAccessToken}` }
      });
      if (!listsRes.ok) {
        const errorText = await listsRes.text();
        console.error("Failed to fetch Google Task Lists:", errorText);
        if (listsRes.status === 403 || errorText.includes("disabled") || errorText.includes("Tasks API")) {
          setGoogleTasksError("Google Tasks API has not been enabled in Google Cloud Console. Go to API library to enable 'Google Tasks API' for this project, then retry.");
        } else {
          setGoogleTasksError("Failed to sync with Google Tasks: " + errorText);
        }
        setIsSyncingGoogleTasks(false);
        return;
      }
      setGoogleTasksError(null);
      const listsData = await listsRes.json();
      const googleLists: any[] = listsData.items || [];

      // 2. Fetch Tasks for each list and merge
      let updatedLists = [...lists];
      const tasksToMerge: Task[] = [];

      for (const gList of googleLists) {
        if (!updatedLists.includes(gList.title)) {
          updatedLists.push(gList.title);
          if (isFirebase && userId) {
            try {
              await setDoc(doc(db, "users", userId, "lists", gList.title), { name: gList.title });
            } catch (err) {
              console.error("Error prepopulating synced list:", err);
            }
          }
        }

        const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${gList.id}/tasks?showCompleted=true&showHidden=true`, {
          headers: { "Authorization": `Bearer ${globalAccessToken}` }
        });
        if (!tasksRes.ok) {
          console.error(`Failed to fetch tasks for list ${gList.title}:`, await tasksRes.text());
          continue;
        }
        const tasksData = await tasksRes.json();
        const googleTasks: any[] = tasksData.items || [];

        for (const gTask of googleTasks) {
          if (gTask.deleted) continue;

          const isDone = gTask.status === 'completed';
          const deadlineIso = gTask.due ? new Date(gTask.due).toISOString() : undefined;
          
          const mappedTask: Partial<Task> = {
            title: gTask.title || "(No Title)",
            status: isDone ? 'done' : 'active',
            list: gList.title,
            googleTaskId: gTask.id,
            googleTaskListId: gList.id,
            completed_at: gTask.completed || undefined,
            deadline_iso: deadlineIso,
            reasoning: gTask.notes || "Synced from Google Tasks.",
          };
          
          const existingTask = tasks.find(t => t.googleTaskId === gTask.id);
          if (existingTask) {
            const merged = {
              ...existingTask,
              ...mappedTask,
            };
            tasksToMerge.push(merged);
          } else {
            const newTask: Task = {
              id: `g-${gTask.id}`,
              title: mappedTask.title!,
              deadline_iso: mappedTask.deadline_iso,
              estimated_minutes: 30,
              difficulty: 'medium',
              urgency: 'later',
              category: 'work',
              priority_score: 5,
              calendar_conflict: null,
              reasoning: mappedTask.reasoning!,
              status: mappedTask.status!,
              created_at: gTask.updated || new Date().toISOString(),
              checklist: [],
              starred: false,
              list: mappedTask.list!,
              googleTaskId: gTask.id,
              googleTaskListId: gList.id,
            };
            tasksToMerge.push(newTask);
          }
        }
      }

      setLists(updatedLists);

      if (isFirebase && userId) {
        for (const task of tasksToMerge) {
          await setDoc(doc(db, "users", userId, "tasks", task.id), task, { merge: true });
        }
      } else {
        const nonGoogleTasks = tasks.filter(t => !t.googleTaskId);
        const finalTasks = [...tasksToMerge, ...nonGoogleTasks];
        saveTasksLocal(finalTasks);
      }

      console.log(`Successfully completed Google Tasks synchronization. Synced ${tasksToMerge.length} tasks.`);
    } catch (error) {
      console.error("Error syncing Google Tasks:", error);
    } finally {
      setIsSyncingGoogleTasks(false);
    }
  };

  const syncTaskToGoogleTasks = async (task: Task) => {
    if (!globalAccessToken) {
      console.log("No Google Tasks access token cached. Skipping Google Tasks sync.");
      return;
    }

    try {
      let taskListId = task.googleTaskListId;
      let taskId = task.googleTaskId;

      if (!taskListId) {
        const listsRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
          headers: { "Authorization": `Bearer ${globalAccessToken}` }
        });
        if (listsRes.ok) {
          const listsData = await listsRes.json();
          const googleLists = listsData.items || [];
          const matchedList = googleLists.find((l: any) => l.title?.toLowerCase() === task.list?.toLowerCase());
          if (matchedList) {
            taskListId = matchedList.id;
          } else {
            const createListRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${globalAccessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ title: task.list || "My Tasks" })
            });
            if (createListRes.ok) {
              const newListData = await createListRes.json();
              taskListId = newListData.id;
              if (!lists.includes(task.list)) {
                setLists(prev => [...prev, task.list]);
              }
            }
          }
        }
      }

      if (!taskListId) {
        taskListId = "@default";
      }

      const body = {
        id: taskId || undefined,
        title: task.title,
        notes: task.reasoning || "",
        status: task.status === 'done' ? 'completed' : 'needsAction',
        due: task.deadline_iso ? new Date(task.deadline_iso).toISOString() : undefined
      };

      const url = taskId
        ? `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`
        : `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;

      const res = await fetch(url, {
        method: taskId ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${globalAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        if (!taskId && data.id) {
          if (isFirebase && userId) {
            const taskRef = doc(db, "users", userId, "tasks", task.id);
            await setDoc(taskRef, { googleTaskId: data.id, googleTaskListId: taskListId }, { merge: true });
          } else {
            task.googleTaskId = data.id;
            task.googleTaskListId = taskListId;
          }
          console.log(`Successfully created task in Google Tasks: ${task.title}`);
        } else {
          console.log(`Successfully updated task in Google Tasks: ${task.title}`);
        }
      } else {
        console.error("Failed to sync task to Google Tasks:", await res.text());
      }
    } catch (e) {
      console.error("Error syncing task to Google Tasks:", e);
    }
  };

  const deleteGoogleTask = async (googleTaskId?: string, googleTaskListId?: string) => {
    if (!globalAccessToken || !googleTaskId || !googleTaskListId) return;
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${googleTaskListId}/tasks/${googleTaskId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${globalAccessToken}`
        }
      });
      if (res.ok) {
        console.log(`Deleted Google Task: ${googleTaskId}`);
      } else {
        console.error(`Failed to delete Google Task:`, await res.text());
      }
    } catch (e) {
      console.error("Error deleting Google Task:", e);
    }
  };

  // Auto-sync Google Tasks on authentication
  useEffect(() => {
    if (accessToken) {
      syncGoogleTasks();
    }
  }, [accessToken]);

  // Google Calendar integration methods
  const syncTaskToGoogleCalendar = async (task: Task) => {
    if (!globalAccessToken) {
      console.log("No Google Calendar access token cached. Skipping calendar sync.");
      return;
    }
    
    try {
      const isNew = !task.calendarEventId;
      const url = isNew 
        ? "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        : `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendarEventId}`;
      
      const startIso = task.deadline_iso || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const startDate = new Date(startIso);
      const endDate = new Date(startDate.getTime() + (task.estimated_minutes || 30) * 60 * 1000);
      
      // Determine elegant title reflecting completeness
      const displayTitle = task.status === 'done' 
        ? `[Completed] ${task.title}` 
        : `[Pulse] ${task.title}`;

      const checklistStr = task.checklist && task.checklist.length > 0
        ? "\n\nChecklist:\n" + task.checklist.map(c => `[${c.is_done ? 'X' : ' '}] ${c.step} (${c.minutes}m)`).join('\n')
        : "";

      const body = {
        summary: displayTitle,
        description: `Task Category: ${task.category || 'work'}\nPriority Score: ${task.priority_score || 5}\nAI Reasoning: ${task.reasoning || 'Structured by Pulse AI.'}${checklistStr}`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        }
      };

      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Authorization": `Bearer ${globalAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setGoogleCalendarError(null);
        if (isNew && data.id) {
          // Store the calendarEventId in Firestore
          if (isFirebase && userId) {
            const taskRef = doc(db, "users", userId, "tasks", task.id);
            await setDoc(taskRef, { calendarEventId: data.id }, { merge: true });
          } else {
            // guest mode update
            task.calendarEventId = data.id;
          }
        }
        console.log(`Successfully synced task to Google Calendar: ${displayTitle}`);
      } else {
        const errText = await res.text();
        console.error(`[Google Calendar API Failure] Failed to sync task to Google Calendar. Status: ${res.status}. Reason:`, errText);
        setGoogleCalendarError(`Google Calendar API failed with status ${res.status}: ${errText}`);
      }
    } catch (e) {
      console.error("[Google Calendar API Exception] Error syncing task to calendar:", e);
      setGoogleCalendarError(e instanceof Error ? e.message : String(e));
    }
  };

  // Automated observer pattern for new Firestore tasks to Google Calendar sync
  useEffect(() => {
    if (!isFirebase || !userId || !accessToken) return;

    const autoSyncNewTasks = async () => {
      // Find active tasks that do not have a calendarEventId and are not currently syncing
      const tasksToSync = tasks.filter(task => 
        task.status === 'active' && 
        !task.calendarEventId && 
        !syncingTasksRef.current.has(task.id)
      );

      for (const task of tasksToSync) {
        syncingTasksRef.current.add(task.id);
        console.log(`[Auto Calendar Sync] Auto-syncing task to Google Calendar: "${task.title}" (ID: ${task.id})`);
        try {
          await syncTaskToGoogleCalendar(task);
        } catch (error) {
          console.error(`[Auto Calendar Sync Error] Failed to auto-sync task "${task.title}" (ID: ${task.id}):`, error);
        } finally {
          // Remove from tracking cache after 5 seconds to allow state propagation
          setTimeout(() => {
            syncingTasksRef.current.delete(task.id);
          }, 5000);
        }
      }
    };

    autoSyncNewTasks();
  }, [tasks, accessToken, isFirebase, userId]);

  const deleteCalendarEvent = async (calendarEventId: string) => {
    if (!globalAccessToken || !calendarEventId) return;
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${globalAccessToken}`
        }
      });
      if (res.ok) {
        console.log(`Deleted calendar event: ${calendarEventId}`);
      } else {
        console.error(`Failed to delete calendar event:`, await res.text());
      }
    } catch (e) {
      console.error("Error deleting calendar event:", e);
    }
  };

  // Helper local storage functions
  const saveTasksLocal = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("pulse_tasks_v2", JSON.stringify(newTasks));
  };

  const saveListsLocal = (newLists: string[]) => {
    setLists(newLists);
    localStorage.setItem("pulse_lists_v2", JSON.stringify(newLists));
  };

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem("pulse_tasks_v2");
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        setTasks(DEMO_TASKS);
      }
    } else {
      setTasks(DEMO_TASKS);
      localStorage.setItem("pulse_tasks_v2", JSON.stringify(DEMO_TASKS));
    }

    const storedLists = localStorage.getItem("pulse_lists_v2");
    if (storedLists) {
      try {
        setLists(JSON.parse(storedLists));
      } catch (e) {
        // keep default lists
      }
    }
    setLoading(false);
  };

  // Initialize connection and handle Auth state changed
  useEffect(() => {
    let authUnsubscribed = false;
    let unsubscribeAuth: (() => void) | null = null;

    async function init() {
      try {
        await initializeFirebaseConnection();
        // Capture Google OAuth credential after redirect sign-in (iframe flow)
        try {
          const redirectResult = await getRedirectResult(auth);
          if (redirectResult) {
            const credential = GoogleAuthProvider.credentialFromResult(redirectResult);
            if (credential?.accessToken) setAccessToken(credential.accessToken);
          }
        } catch (e) {
          console.warn("getRedirectResult failed:", e);
        }
        if (authUnsubscribed) return;


        unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            setUserId(firebaseUser.uid);
            setUser(firebaseUser);
            setIsFirebase(true);
            setIsGuest(false);
            localStorage.removeItem("pulse_is_guest");
          } else {
            setUserId(null);
            setUser(null);
            setIsFirebase(false);
            setAccessToken(null);
            loadFromLocalStorage();
          }
          setAuthChecking(false);
        });
      } catch (error) {
        console.error("Firebase auth restricted or failed, falling back to Local Storage:", error);
        setUserId(null);
        setUser(null);
        setIsFirebase(false);
        loadFromLocalStorage();
        setAuthChecking(false);
      }
    }

    init();

    return () => {
      authUnsubscribed = true;
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Listen to Firestore Tasks and Lists real-time snapshots
  useEffect(() => {
    if (!userId || !isFirebase) return;

    setLoading(true);

    // 1. Subscribe to Lists collection
    const listsColRef = collection(db, "users", userId, "lists");
    const unsubscribeLists = onSnapshot(listsColRef, async (snapshot) => {
      if (snapshot.empty) {
        // Pre-populate user custom list entries if completely empty
        const defaultLists = ["My Tasks", "Hackathon Tasks", "Personal Inbox"];
        for (const listName of defaultLists) {
          try {
            await setDoc(doc(db, "users", userId, "lists", listName), { name: listName });
          } catch (e) {
            console.error("Failed to prepopulate lists: ", e);
          }
        }
      } else {
        const fetchedLists = snapshot.docs.map(doc => doc.data().name as string);
        setLists(fetchedLists);
      }
    }, (error) => {
      console.error("Firestore lists snapshot error:", error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/lists`);
      } catch (e) {
        console.error("Lists snapshot error thrown:", e);
      }
    });

    // 2. Subscribe to Tasks collection
    const tasksColRef = collection(db, "users", userId, "tasks");
    const unsubscribeTasks = onSnapshot(tasksColRef, async (snapshot) => {
      if (snapshot.empty) {
        // Pre-populate tasks collection with DEMO_TASKS
        for (const demoTask of DEMO_TASKS) {
          try {
            await setDoc(doc(db, "users", userId, "tasks", demoTask.id), demoTask);
          } catch (e) {
            console.error("Failed to prepopulate tasks: ", e);
          }
        }
        setLoading(false);
      } else {
        const fetchedTasks = snapshot.docs.map(doc => doc.data() as Task);
        // Sort by creation time descending by default
        fetchedTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTasks(fetchedTasks);
        setLoading(false);
      }
    }, (error) => {
      console.error("Firestore tasks snapshot error:", error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/tasks`);
      } catch (e) {
        console.error("Tasks snapshot error thrown:", e);
      }
    });

    return () => {
      unsubscribeLists();
      unsubscribeTasks();
    };
  }, [userId, isFirebase]);

  // Create List in Firestore or LocalStorage
  const createList = async (name: string) => {
    if (!name.trim()) return;
    const cleanName = name.trim();
    if (isFirebase && userId) {
      const listRef = doc(db, "users", userId, "lists", cleanName);
      await setDoc(listRef, { name: cleanName });
    } else {
      if (!lists.includes(cleanName)) {
        const updated = [...lists, cleanName];
        saveListsLocal(updated);
      }
    }
    setActiveList(cleanName);
  };

  // Toggle Task Starred state in Firestore or LocalStorage
  const toggleStar = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nextStarred = !task.starred;
    const updatedTask = { ...task, starred: nextStarred };

    if (isFirebase && userId) {
      const taskRef = doc(db, "users", userId, "tasks", id);
      await setDoc(taskRef, { starred: nextStarred }, { merge: true });
    } else {
      const updated = tasks.map(t => t.id === id ? { ...t, starred: nextStarred } : t);
      saveTasksLocal(updated);
    }

    if (globalAccessToken) {
      await syncTaskToGoogleCalendar(updatedTask);
      await syncTaskToGoogleTasks(updatedTask);
    }
  };

  // Toggle Task status (Done/Active) in Firestore or LocalStorage
  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isNowDone = task.status !== 'done';
    const status = isNowDone ? 'done' as const : 'active' as const;
    const completed_at = isNowDone ? new Date().toISOString() : null;
    const checklist = task.checklist.map(c => ({ ...c, is_done: isNowDone }));
    const updatedTask = { ...task, status, completed_at: completed_at || undefined, checklist };

    if (isFirebase && userId) {
      const taskRef = doc(db, "users", userId, "tasks", id);
      await setDoc(taskRef, {
        status,
        completed_at,
        checklist
      }, { merge: true });
    } else {
      const updated = tasks.map(t => t.id === id ? {
        ...t,
        status,
        completed_at: completed_at || undefined,
        checklist
      } : t);
      saveTasksLocal(updated);
    }

    if (globalAccessToken) {
      await syncTaskToGoogleCalendar(updatedTask);
      await syncTaskToGoogleTasks(updatedTask);
    }
  };

  // Toggle checklist sub-item complete in Firestore or LocalStorage
  const toggleChecklistItem = async (taskId: string, itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map(c => 
      c.id === itemId ? { ...c, is_done: !c.is_done } : c
    );
    const allDone = updatedChecklist.length > 0 && updatedChecklist.every(c => c.is_done);
    const status = allDone ? 'done' as const : task.status;
    const completed_at = allDone ? new Date().toISOString() : (task.completed_at || null);
    const updatedTask = { ...task, checklist: updatedChecklist, status, completed_at: completed_at || undefined };

    if (isFirebase && userId) {
      const taskRef = doc(db, "users", userId, "tasks", taskId);
      await setDoc(taskRef, {
        checklist: updatedChecklist,
        status,
        completed_at
      }, { merge: true });
    } else {
      const updated = tasks.map(t => t.id === taskId ? {
        ...t,
        checklist: updatedChecklist,
        status,
        completed_at: completed_at || undefined
      } : t);
      saveTasksLocal(updated);
    }

    if (globalAccessToken) {
      await syncTaskToGoogleCalendar(updatedTask);
      await syncTaskToGoogleTasks(updatedTask);
    }
  };

  // Delete task in Firestore or LocalStorage
  const deleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (isFirebase && userId) {
      await deleteDoc(doc(db, "users", userId, "tasks", id));
    } else {
      const updated = tasks.filter(t => t.id !== id);
      saveTasksLocal(updated);
    }

    if (task && task.calendarEventId && globalAccessToken) {
      await deleteCalendarEvent(task.calendarEventId);
    }
    if (task && task.googleTaskId && globalAccessToken) {
      await deleteGoogleTask(task.googleTaskId, task.googleTaskListId);
    }
  };

  // Helper delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Natural Language Task Parser using server-side Gemini API
  const addTaskNatural = async (inputText: string) => {
    if (!inputText.trim()) return;

    setAiLoading(true);
    setAiStepsHistory([]);
    
    const traceSteps = [
      "Parsing your task description...",
      "Estimating task difficulty and required minutes...",
      "Checking calendar slots for event conflicts...",
      "Calculating optimal dynamic priority score...",
      "Generating action checklist sub-items..."
    ];

    for (let i = 0; i < traceSteps.length; i++) {
      setAiStep(traceSteps[i]);
      setAiStepsHistory(prev => [...prev, traceSteps[i]]);
      await delay(400);
    }

    try {
      const parseRes = await fetch("/api/gemini/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: inputText,
          datetime: new Date().toISOString(),
          calendar_events: [
            { summary: "Team Standup", start: "10:00 AM", end: "10:30 AM" },
            { summary: "Client Call", start: "3:00 PM", end: "4:00 PM" }
          ]
        })
      });

      if (!parseRes.ok) throw new Error("Parser API error");
      const parsedTask = await parseRes.json();

      const checklistRes = await fetch("/api/gemini/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsedTask.title,
          deadline_human: parsedTask.deadline_human,
          estimated_minutes: parsedTask.estimated_minutes,
          difficulty: parsedTask.difficulty
        })
      });

      let subItems: ChecklistItem[] = [];
      if (checklistRes.ok) {
        const items = await checklistRes.json();
        subItems = items.map((it: any, index: number) => ({
          id: `checklist-item-${Date.now()}-${index}`,
          step: it.step,
          minutes: it.minutes,
          is_done: false
        }));
      }

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: parsedTask.title,
        deadline_iso: parsedTask.deadline_iso || null,
        deadline_human: parsedTask.deadline_human || null,
        estimated_minutes: parsedTask.estimated_minutes || 25,
        difficulty: parsedTask.difficulty || "medium",
        urgency: parsedTask.urgency || "later",
        category: parsedTask.category || "work",
        priority_score: parsedTask.priority_score || 5,
        calendar_conflict: parsedTask.calendar_conflict || null,
        reasoning: parsedTask.reasoning || "Structured by Pulse AI.",
        status: "active",
        created_at: new Date().toISOString(),
        checklist: subItems,
        starred: false,
        list: activeList
      };

      if (isFirebase && userId) {
        await setDoc(doc(db, "users", userId, "tasks", newTask.id), newTask);
      } else {
        saveTasksLocal([newTask, ...tasks]);
      }

      if (globalAccessToken) {
        await syncTaskToGoogleCalendar(newTask);
        await syncTaskToGoogleTasks(newTask);
      }
    } catch (error) {
      console.error("AI parsing failed:", error);
    } finally {
      setAiLoading(false);
      setAiStep("");
    }
  };

  // Tasks 2.0 — create task from structured AI intake + chip answers
  const addTaskStructured = async (
    intake: import('../types').IntakeResult,
    answers: Record<string, string>
  ): Promise<void> => {
    const urgency: Task['urgency'] =
      intake.priority === 'high' ? 'critical' : intake.priority === 'medium' ? 'high' : 'later';

    // Parse "when" answer into a rough ISO deadline
    let deadline_iso: string | undefined;
    let deadline_human: string | undefined;
    const when = answers.when || intake.extractedEntities?.time;
    if (when) {
      const d = new Date();
      const w = when.toLowerCase();
      if (w.includes('tomorrow')) d.setDate(d.getDate() + 1);
      else if (w.includes('week')) d.setDate(d.getDate() + 3);
      d.setHours(17, 0, 0, 0);
      deadline_iso = d.toISOString();
      deadline_human = when;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: intake.title,
      deadline_iso,
      deadline_human,
      estimated_minutes: intake.complexity === 'complex' ? 60 : intake.complexity === 'medium' ? 30 : 15,
      difficulty: intake.complexity === 'complex' ? 'hard' : intake.complexity === 'medium' ? 'medium' : 'easy',
      urgency,
      category: intake.taskType === 'payment' ? 'finance' : intake.taskType === 'meeting' ? 'work' : 'personal',
      priority_score: urgency === 'critical' ? 9 : urgency === 'high' ? 6 : 3,
      calendar_conflict: null,
      reasoning: intake.priorityReason,
      status: 'active',
      created_at: new Date().toISOString(),
      checklist: [],
      starred: false,
      list: activeList,
      taskType: intake.taskType,
      complexity: intake.complexity,
      person: answers.who || intake.extractedEntities?.person,
      location: intake.extractedEntities?.location,
      roadmapSteps: (intake.roadmapSteps || []).map((s) => ({ ...s, done: false })),
      priorityReason: intake.priorityReason,
    };

    if (isFirebase && userId) {
      await setDoc(doc(db, 'users', userId, 'tasks', newTask.id), newTask);
    } else {
      saveTasksLocal([newTask, ...tasks]);
    }
  };

  // Toggle a roadmap step done state
  const toggleRoadmapStep = async (taskId: string, stepIndex: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.roadmapSteps) return;
    const updated = task.roadmapSteps.map((s, i) =>
      i === stepIndex ? { ...s, done: !s.done } : s
    );
    const next: Task = { ...task, roadmapSteps: updated };
    if (isFirebase && userId) {
      await setDoc(doc(db, 'users', userId, 'tasks', taskId), next);
    } else {
      saveTasksLocal(tasks.map((t) => (t.id === taskId ? next : t)));
    }
  };

  // Break it Down feature
  const breakTaskDown = async (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    setAiLoading(true);
    setAiStepsHistory([]);
    setAiStep(`Deconstructing '${targetTask.title}'...`);
    setAiStepsHistory(prev => [...prev, `Deconstructing '${targetTask.title}'...`]);
    await delay(350);
    setAiStep("Generating incremental 5-minute action steps...");
    setAiStepsHistory(prev => [...prev, "Generating incremental 5-minute action steps..."]);
    await delay(350);

    try {
      const res = await fetch("/api/gemini/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: targetTask.title,
          deadline_human: targetTask.deadline_human || "",
          estimated_minutes: targetTask.estimated_minutes,
          difficulty: targetTask.difficulty
        })
      });

      if (res.ok) {
        const items = await res.json();
        const subItems: ChecklistItem[] = items.map((it: any, index: number) => ({
          id: `checklist-item-${Date.now()}-${index}`,
          step: it.step,
          minutes: it.minutes,
          is_done: false
        }));

        const updatedTask = { ...targetTask, checklist: subItems };

        if (isFirebase && userId) {
          const taskRef = doc(db, "users", userId, "tasks", id);
          await setDoc(taskRef, { checklist: subItems }, { merge: true });
        } else {
          const updated = tasks.map(t => t.id === id ? { ...t, checklist: subItems } : t);
          saveTasksLocal(updated);
        }

        if (globalAccessToken) {
          await syncTaskToGoogleCalendar(updatedTask);
          await syncTaskToGoogleTasks(updatedTask);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
      setAiStep("");
    }
  };

  // Rescue Me feature
  const rescueTask = async (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    setAiLoading(true);
    setAiStepsHistory([]);
    setAiStep(`Rescuing Jitesh from '${targetTask.title}' inertia...`);
    setAiStepsHistory(prev => [...prev, "Initiating Cognitive Rescue protocol..."]);
    await delay(350);
    setAiStep("Generating a 3-minute ultra-low barrier action...");
    setAiStepsHistory(prev => [...prev, "Isolating micro-step for immediate traction..."]);
    await delay(350);

    const rescueStep: ChecklistItem = {
      id: `checklist-rescue-${Date.now()}`,
      step: `Open materials & spend exactly 3 minutes looking over the prompt (no pressure!)`,
      minutes: 3,
      is_done: false
    };

    const nextPriority = Math.max(1, (targetTask.priority_score || 5) - 2);
    const nextChecklist = [rescueStep, ...targetTask.checklist];
    const updatedTask = {
      ...targetTask,
      difficulty: "easy" as const,
      urgency: "later" as const,
      priority_score: nextPriority,
      checklist: nextChecklist
    };

    if (isFirebase && userId) {
      const taskRef = doc(db, "users", userId, "tasks", id);
      await setDoc(taskRef, {
        difficulty: "easy",
        urgency: "later",
        priority_score: nextPriority,
        checklist: nextChecklist
      }, { merge: true });
    } else {
      const updated = tasks.map(t => t.id === id ? {
        ...t,
        difficulty: "easy" as const,
        urgency: "later" as const,
        priority_score: nextPriority,
        checklist: nextChecklist
      } : t);
      saveTasksLocal(updated);
    }

    if (globalAccessToken) {
      await syncTaskToGoogleCalendar(updatedTask);
      await syncTaskToGoogleTasks(updatedTask);
    }

    setAiLoading(false);
    setAiStep("");
  };

  // Standard short manual add
  const addManualTask = async (title: string, urgency: 'critical' | 'high' | 'later') => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      estimated_minutes: 25,
      difficulty: "medium",
      urgency,
      category: "work",
      priority_score: urgency === 'critical' ? 9 : urgency === 'high' ? 7 : 4,
      calendar_conflict: null,
      reasoning: "Manually registered.",
      status: "active",
      created_at: new Date().toISOString(),
      checklist: [
        { id: `c-${Date.now()}-1`, step: "Start working on objective", minutes: 15, is_done: false },
        { id: `c-${Date.now()}-2`, step: "Submit completed work", minutes: 10, is_done: false }
      ],
      starred: false,
      list: activeList
    };

    if (isFirebase && userId) {
      await setDoc(doc(db, "users", userId, "tasks", newTask.id), newTask);
    } else {
      saveTasksLocal([newTask, ...tasks]);
    }

    if (globalAccessToken) {
      await syncTaskToGoogleCalendar(newTask);
      await syncTaskToGoogleTasks(newTask);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/tasks');
    if (isIframed) {
      // Popups are blocked inside iframes (Lovable preview). Use redirect.
      await signInWithRedirect(auth, provider);
      return;
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setAccessToken(credential.accessToken);
    }
    return result;
  };

  const signInWithEmail = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    localStorage.removeItem("pulse_is_guest");
    setIsGuest(false);
    return signOut(auth);
  };

  const continueAsGuest = () => {
    localStorage.setItem("pulse_is_guest", "true");
    setIsGuest(true);
  };

  return {
    tasks,
    loading,
    aiLoading,
    aiStep,
    aiStepsHistory,
    lists,
    activeList,
    setActiveList,
    createList,
    activeTab,
    setActiveTab,
    toggleStar,
    toggleComplete,
    toggleChecklistItem,
    deleteTask,
    addTaskNatural,
    addTaskStructured,
    toggleRoadmapStep,
    addManualTask,
    breakTaskDown,
    rescueTask,
    user,
    authChecking,
    isGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    continueAsGuest,
    accessToken,
    setAccessToken,
    isSyncingGoogleTasks,
    syncGoogleTasks,
    googleTasksError,
    googleCalendarError
  };
}

