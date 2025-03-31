"use client";
import React, { useEffect, useState } from "react";
import styles from "../../styles/appointments.module.css";
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
    username: string;
};

const Appointments = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [actionType, setActionType] = useState<"confirmed" | "cancelled" | null>(null);
    const [loading, setLoading] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => setHydrated(true), []);
    useEffect(() => {
        fetchAppointments();
    }, []);

    const showToast = (message: string, type: "success" | "error" | "info") => {
        setToast({ message, type });
    };

    const fetchAppointments = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:5000/api/admin/appointments", {
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

            setAppointments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            showToast("Failed to fetch appointments", "error");
            setAppointments([]);
        }
    };

    const handleApproval = async () => {
        if (!selectedAppointment || !actionType) return;

        setLoading(true);

        const token = localStorage.getItem("token");

        const formattedDate = new Date(selectedAppointment.appointment_date).toLocaleDateString("en-CA");

        try {
            const res = await fetch(`http://localhost:5000/api/admin/appointments/${selectedAppointment.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: actionType }),
            });

            if (!res.ok) {
                throw new Error("Failed to update appointment status");
            }

            if (actionType === "confirmed") {

                await fetch(`http://localhost:5000/api/admin/appointments/cancel`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        doctor_id: selectedAppointment.doctor_id,
                        appointment_date: formattedDate,
                        time_slot: selectedAppointment.time_slot,
                    }),

                });
            }
            fetchAppointments();
            showToast(`Appointment ${actionType} successfully.`, "success");
            setIsConfirmationOpen(false);
        } catch (error) {
            console.error("Error updating appointment status:", error);
            showToast("Failed to update appointment status", "error");
        } finally {
            setLoading(false);
        }
    };

    const openConfirmationDialog = (appointment: Appointment, type: "confirmed" | "cancelled") => {
        setSelectedAppointment(appointment);
        setActionType(type);
        setIsConfirmationOpen(true);
    };

    const closeConfirmationDialog = () => {
        if (loading) return;
        setIsConfirmationOpen(false);
        setSelectedAppointment(null);
        setActionType(null);
    };

    return hydrated ? (
        <div className={styles.container}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h2 className={styles.title}>Manage Appointments</h2>

            <div className={styles.cardsContainer}>
                {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                        <div key={appointment.id} className={styles.card}>
                            <h3>{appointment.doctor_name}</h3>
                            <p><strong>Patient:</strong> {appointment.username}</p>
                            <p>
                                <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                            <p><strong>Time:</strong> {appointment.time_slot}</p>
                            <p><strong>Method:</strong> {appointment.method}</p>
                            <p><strong>Location:</strong> {appointment.location}</p>
                            <p><strong>Status:</strong> {appointment.status}</p>

                            {appointment.status === "pending" && (
                                <div className={styles.buttonGroup}>
                                    <button
                                        onClick={() => openConfirmationDialog(appointment, "confirmed")}
                                        className={styles.approveButton}
                                        disabled={loading}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => openConfirmationDialog(appointment, "cancelled")}
                                        className={styles.rejectButton}
                                        disabled={loading}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className={styles.noAppointments}>No appointments available to approve or reject</p>
                )}
            </div>

            {isConfirmationOpen && selectedAppointment && actionType && (
                <div className={styles.confirmationPopup}>
                    <div className={styles.popupContent}>
                        <h3>
                            Are you sure you want to{" "}
                            <span style={{ color: actionType === "confirmed" ? "green" : "red", fontWeight: "bold" }}>
                                {actionType === "confirmed" ? "approve" : "reject"}
                            </span>{" "}
                            this appointment?
                        </h3>

                        {loading ? (
                            <div className={styles.loader}></div>
                        ) : (
                            <div className={styles.popupButtons}>
                                <button onClick={handleApproval} className={styles.approveButton}>
                                    Yes
                                </button>
                                <button onClick={closeConfirmationDialog} className={styles.rejectButton}>
                                    No
                                </button>
                                <button onClick={closeConfirmationDialog} className={styles.closeButton}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    ) : <div>Loading...</div>;
};

export default Appointments;
