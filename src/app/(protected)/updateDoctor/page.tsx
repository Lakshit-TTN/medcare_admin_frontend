"use client";
import React, { useEffect, useState } from "react";
import styles from "../../styles/Updatenaddelete.module.css";
import { useRouter } from "next/navigation";
import Toast from "../../../components/toast/Toast";

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  qualifications: string[];
  experience: number;
  bio: string;
  gender: string;
  hospital: string[];
  diseases: string[];
  availability: string;
};

const UpdateAndDelete = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 8;
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/admin/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();


      if (Array.isArray(data)) {
        setDoctors(
          data.map((doc) => ({
            ...doc,
            qualifications: typeof doc.qualifications === "string" ? doc.qualifications.split(",") : doc.qualifications || [],
            hospital: typeof doc.hospital === "string" ? doc.hospital.split(",") : doc.hospital || [],
            diseases: typeof doc.diseases === "string" ? doc.diseases.split(",") : doc.diseases || [],
            availability: doc.availability || "",
          }))
        );
      } else {
        console.error("Unexpected API response format:", data);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleDelete = async () => {
    if (!showDeletePopup.id) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/delete/${showDeletePopup.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to delete doctor");
      }
      showToast("Deleted successfully", "success");
      setDoctors(doctors.filter((doc) => doc.id !== showDeletePopup.id));
      setShowDeletePopup({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting doctor:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!editDoctor) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/doctors/${editDoctor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editDoctor.name,
          specialty: editDoctor.specialty,
          qualifications: editDoctor.qualifications,
          experience: editDoctor.experience,
          bio: editDoctor.bio,
          gender: editDoctor.gender,
          hospital: editDoctor.hospital,
          diseases: editDoctor.diseases,
          availability: editDoctor.availability,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update doctor");
      }
      const updatedDoctor = await res.json();
      setDoctors(doctors.map((doc) => (doc.id === editDoctor.id ? updatedDoctor.doctor : doc)));
      showToast("Doctor updated successfully", "success");
      setShowEditPopup(false);
      setEditDoctor(null);
    } catch (error) {
      console.error("Error updating doctor:", error);
      showToast("Failed to update doctor", "error");
    }
  };

  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = doctors.slice(indexOfFirstDoctor, indexOfLastDoctor);

  return hydrated ? (
    <div className={styles.wrapper}>

      <div className={styles.container}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <h2 className={styles.title}>Manage Doctors</h2>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Specialty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentDoctors.map((doc) => (
              <tr key={doc.id} className={styles.row}>
                <td>{doc.name}</td>
                <td>{doc.specialty}</td>
                <td>
                  <div className={styles.buttonGroup}>
                    <button onClick={() => { setEditDoctor(doc); setShowEditPopup(true); }}>Edit</button>
                    <button onClick={() => setShowDeletePopup({ show: true, id: doc.id })} className={styles.deleteButton}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.pagination}>
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            ◄
          </button>
          <span>Page {currentPage} of {Math.ceil(doctors.length / doctorsPerPage)}</span>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(doctors.length / doctorsPerPage)))} disabled={currentPage === Math.ceil(doctors.length / doctorsPerPage)}>
            ►
          </button>
        </div>

        {showEditPopup && editDoctor && (
          <div className={styles.popup}>
            <div className={styles.popupContent}>
              <button className={styles.closeButton} onClick={() => setShowEditPopup(false)}>✖</button>
              <h3>Edit Doctor Details</h3>
              <form onSubmit={handleUpdate}>
                <label>Name:</label>
                <input type="text" name="name" value={editDoctor.name} onChange={(e) => setEditDoctor({ ...editDoctor, name: e.target.value })} placeholder="Doctor Name" />

                <label>Specialty:</label>
                <input type="text" name="specialty" value={editDoctor.specialty} onChange={(e) => setEditDoctor({ ...editDoctor, specialty: e.target.value })} placeholder="Specialty" />

                <label>Qualifications:</label>
                <input type="text" value={editDoctor?.qualifications?.join(",") || ""} onChange={(e) => setEditDoctor({ ...editDoctor, qualifications: e.target.value.split(",") })} placeholder="Qualifications (comma-separated)" />

                <label>Experience:</label>
                <input type="number" name="experience" value={editDoctor.experience} onChange={(e) => setEditDoctor({ ...editDoctor, experience: Number(e.target.value) })} placeholder="Years of Experience" />

                <label>Bio:</label>
                <textarea name="bio" value={editDoctor.bio} onChange={(e) => setEditDoctor({ ...editDoctor, bio: e.target.value })} placeholder="Bio"></textarea>

                <div className={styles.genderContainer}>
                  <label>Gender:</label>
                  <label><input type="radio" name="gender" value="Male" checked={editDoctor.gender === "Male"} onChange={(e) => setEditDoctor({ ...editDoctor, gender: e.target.value })} /> Male</label>
                  <label><input type="radio" name="gender" value="Female" checked={editDoctor.gender === "Female"} onChange={(e) => setEditDoctor({ ...editDoctor, gender: e.target.value })} /> Female</label>
                </div>


                <label>Hospital:</label>
                <input type="text" value={editDoctor?.hospital?.join(",") || ""} onChange={(e) => setEditDoctor({ ...editDoctor, hospital: e.target.value.split(",") })} placeholder="Hospitals (comma-separated)" />

                <label>Diseases:</label>
                <input
                  type="text"
                  value={editDoctor?.diseases?.join(",") || ""}
                  onChange={(e) => {
                    if (editDoctor) {
                      setEditDoctor({ ...editDoctor, diseases: e.target.value.split(",") });
                    }
                  }}
                  placeholder="Diseases (comma-separated)"
                />


                <div>
                  <label>Availability:</label>
                  <input
                    className={styles.availability}
                    type="text"
                    value={editDoctor?.availability || ""}
                    onChange={(e) =>
                      setEditDoctor((prev) =>
                        prev ? { ...prev, availability: e.target.value } : null
                      )
                    }
                    placeholder="e.g., Thursday-Sunday: 10-2"
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button type="submit" className={styles.saveButton}>Save Changes</button>
                  <button type="button" className={styles.cancelButton} onClick={() => setShowEditPopup(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeletePopup.show && (
          <div className={styles.popup}>
            <div className={styles.popupContent}>
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this doctor?</p>
              <div className={styles.buttonGroup}>
                <button className={styles.cancelButton} onClick={() => setShowDeletePopup({ show: false, id: null })}>
                  Cancel
                </button>
                <button className={styles.saveButton} onClick={handleDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  ) : <div>Loading...</div>;
};

export default UpdateAndDelete;
