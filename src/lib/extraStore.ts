import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cashier" | "kitchen";
  phone?: string;
  active: boolean;
  hired_at: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  party_size: number;
  date: string;
  time: string;
  table_id?: string | null;
  notes?: string;
  status: "pending" | "confirmed" | "seated" | "cancelled";
}

interface ExtraState {
  employees: Employee[];
  bookings: Booking[];
  upsertEmployee: (e: Employee) => void;
  deleteEmployee: (id: string) => void;
  upsertBooking: (b: Booking) => void;
  deleteBooking: (id: string) => void;
  resetExtra: () => void;
}

const seedEmployees: Employee[] = [
  { id: "e1", name: "Nisha Iyer", email: "nisha@dineflow.ai", role: "admin", phone: "9876500001", active: true, hired_at: "2024-02-12" },
  { id: "e2", name: "Shareng K", email: "shareng@dineflow.ai", role: "cashier", phone: "9876500002", active: true, hired_at: "2024-05-04" },
  { id: "e3", name: "Ravi Kumar", email: "ravi@dineflow.ai", role: "kitchen", phone: "9876500003", active: true, hired_at: "2024-06-18" },
  { id: "e4", name: "Priya S", email: "priya@dineflow.ai", role: "cashier", phone: "9876500004", active: false, hired_at: "2023-11-09" },
];
const seedBookings: Booking[] = [
  { id: "b1", customer_name: "Arjun Mehta", phone: "9876512345", party_size: 4, date: new Date().toISOString().slice(0, 10), time: "19:00", table_id: "t3", notes: "Birthday", status: "confirmed" },
  { id: "b2", customer_name: "Divya Rao", phone: "9876512346", party_size: 2, date: new Date().toISOString().slice(0, 10), time: "20:30", table_id: "t6", notes: "", status: "pending" },
  { id: "b3", customer_name: "Vikram", phone: "9876512347", party_size: 6, date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: "13:00", table_id: null, notes: "Family lunch", status: "confirmed" },
];

export const useExtraStore = create<ExtraState>()(
  persist(
    (set) => ({
      employees: seedEmployees,
      bookings: seedBookings,
      upsertEmployee: (e) => set(s => {
        const exists = s.employees.find(x => x.id === e.id);
        return { employees: exists ? s.employees.map(x => x.id === e.id ? e : x) : [...s.employees, e] };
      }),
      deleteEmployee: (id) => set(s => ({ employees: s.employees.filter(e => e.id !== id) })),
      upsertBooking: (b) => set(s => {
        const exists = s.bookings.find(x => x.id === b.id);
        return { bookings: exists ? s.bookings.map(x => x.id === b.id ? b : x) : [...s.bookings, b] };
      }),
      deleteBooking: (id) => set(s => ({ bookings: s.bookings.filter(b => b.id !== id) })),
      resetExtra: () => set({ employees: seedEmployees, bookings: seedBookings }),
    }),
    { name: "dineflow-extra", version: 1 }
  )
);
