"use client";
import React, { useEffect, useState } from "react";
import styles from "../../styles/TotalApp.module.css";
import { useRouter } from "next/navigation";
import Toast from "../../../components/toast/Toast";

type Appointment = {
  id: number;
  user_id: number;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  time_slot: string;
  method: string;
  status: "pending" | "confirmed" | "cancelled";
  location: string;
  created_at: string;
  name: string;
  patient_name: string;
};

const ITEMS_PER_PAGE = 8;

const TotalApp = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("All");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/admin/allapp", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setAppointments(data);
        setFilteredAppointments(data);
        const uniqueDoctors = Array.from(new Set(data.map((appt) => appt.doctor_name)));
        setDoctors(["All", ...uniqueDoctors]);
      } else {
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (error) {
      console.log(error);

      showToast("Failed to fetch appointments", "error");
      setAppointments([]);
      setFilteredAppointments([]);
    }
  };

  const handleDoctorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedDoctor(selected);
    setCurrentPage(1);

    if (selected === "All") {
      setFilteredAppointments(appointments);
    } else {
      const filtered = appointments.filter((appt) => appt.doctor_name === selected);
      setFilteredAppointments(filtered);
    }
  };

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  return hydrated ? (
    <div className={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h2 className={styles.title}>All Appointments</h2>

      <div className={styles.filterContainer}>
        <label htmlFor="doctorFilter">Select Doctor:</label>
        <select id="doctorFilter" value={selectedDoctor} onChange={handleDoctorChange}>
          {doctors.map((doctor, index) => (
            <option key={`${doctor}-${index}`} value={doctor}>
              {doctor}
            </option>
          ))}
        </select>
      </div>

      {paginatedAppointments.length > 0 ? (
        <div className={styles.appointmentsTableContainer}>
          <table className={styles.appointmentsTable}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Method</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.map((appointment, index) => (
                <tr key={`${appointment.id}-${index}`}>
                  <td>{appointment.user_id}</td>
                  <td>{appointment.patient_name}</td>
                  <td>{appointment.doctor_name}</td>
                  <td>
                    {new Date(appointment.appointment_date)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                  </td>
                  <td>{appointment.time_slot}</td>
                  <td>{appointment.method}</td>
                  <td>{appointment.location}</td>
                  <td className={
                    appointment.status === "confirmed" ? styles.confirmed :
                      appointment.status === "cancelled" ? styles.cancelled :
                        styles.pending
                  }>
                    {appointment.status === "confirmed" ? "Approved" :
                      appointment.status === "cancelled" ? "Rejected" :
                        "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.noAppointments}>No appointments available</p>
      )}
    </div>
  ) : <div>Loading...</div>;
};

export default TotalApp;
