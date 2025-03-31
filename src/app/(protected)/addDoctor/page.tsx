"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/addDoctor.module.css";
import Toast from "../../../components/toast/Toast";

const AddDoctor = () => {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };
  useEffect(() => setHydrated(true), []);

  const router = useRouter();
  const [doctor, setDoctor] = useState({
    name: "",
    specialty: "",
    qualifications: "",
    experience: "",
    bio: "",
    gender: "Male",
    hospital: "",
    diseases: "",
    availability: { fromDay: "Monday", toDay: "Friday", time: "" },
    imageUrl: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDoctor({ ...doctor, [e.target.name]: e.target.value });
  };

  const handleAvailabilityChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setDoctor({
      ...doctor,
      availability: { ...doctor.availability, [e.target.name]: e.target.value },
    });
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoctor({ ...doctor, gender: e.target.value });
  };

  const validateForm = () => {
    return (
      doctor.name.trim() &&
      doctor.specialty.trim() &&
      doctor.qualifications.trim() &&
      doctor.experience.trim() &&
      doctor.bio.trim() &&
      doctor.hospital.trim() &&
      doctor.diseases.trim() &&
      doctor.availability.time.trim() &&
      doctor.imageUrl 
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Image upload failed");

      console.log("Uploaded Image URL:", data.imageUrl);
      setDoctor((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      showToast("Image uploaded successfully!", "success");

    } catch (error) {
      console.error("Upload Error:", error);
      showToast("Failed to upload image", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fill out all required fields.", "error");
      return;
    }

    try {
      const formattedAvailability = [`${doctor.availability.fromDay}-${doctor.availability.toDay}: ${doctor.availability.time}`];
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...doctor,
          qualifications: doctor.qualifications.split(","),
          hospital: doctor.hospital.split(","),
          diseases: doctor.diseases.split(",").map((d) => d.trim()), // Ensure diseases are properly split
          availability: formattedAvailability,
        }),
      });

      if (!res.ok) throw new Error("Failed to add doctor");
      showToast("Doctor added successfully!", "success");
      setDoctor({
        name: "",
        specialty: "",
        qualifications: "",
        experience: "",
        bio: "",
        gender: "Male",
        hospital: "",
        diseases: "",
        availability: { fromDay: "Monday", toDay: "Friday", time: "" },
        imageUrl: "",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error(err);
      showToast("Error adding doctor", "error");
    }
  };

  return hydrated ? (
    <div className={styles.wrapper}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.container}>
        <h2 className={styles.title}>Add Doctor</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputgrp}>
            <input type="file" onChange={handleImageUpload} accept="image/*" className={styles.file} />
          </div>

          <input className={styles.input} type="text" name="name" placeholder="Doctor Name" required onChange={handleChange} />
          <input className={styles.input} type="text" name="specialty" placeholder="Specialty (e.g Surgeon)" required onChange={handleChange} />

          <input className={styles.input} type="text" name="qualifications" placeholder="Qualifications (comma-separated)" required onChange={handleChange} />
          <input className={styles.input} type="number" name="experience" placeholder="Years of Experience (e.g 10)" required onChange={handleChange} />

          <input className={`${styles.textarea} ${styles.fullWidth}`} type="text" name="bio" placeholder="Bio" onChange={handleChange} required></input>

          <div className={styles.genderContainer}>
            <label className={styles.label}>Gender</label>
            <div className={styles.radioGroup}>
              <label>
                <input type="radio" name="gender" value="Male" checked={doctor.gender === "Male"} onChange={handleGenderChange} />
                Male
              </label>
              <label>
                <input type="radio" name="gender" value="Female" checked={doctor.gender === "Female"} onChange={handleGenderChange} />
                Female
              </label>
            </div>
          </div>

          <input className={styles.input} type="text" name="hospital" placeholder="Available Hospitals (comma-separated)" required onChange={handleChange} />
          <input className={styles.input} type="text" name="diseases" placeholder="Diseases Treated (comma-separated)" required onChange={handleChange} />
          
          <div className={styles.availabilityContainer}>
            <label className={styles.availabilityLabel}>Availability</label>
            <div className={styles.availabilityInputs}>
              <select
                className={styles.select}
                name="fromDay"
                value={doctor.availability.fromDay}
                onChange={handleAvailabilityChange}
                required
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <select
                className={styles.select}
                name="toDay"
                value={doctor.availability.toDay}
                onChange={handleAvailabilityChange}
                required
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                  .filter(day => day !== doctor.availability.fromDay)
                  .map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))
                }
              </select>
              <input
                className={styles.input}
                type="text"
                name="time"
                placeholder="e.g., 10 AM - 5 PM"
                value={doctor.availability.time}
                required
                onChange={handleAvailabilityChange}
              />
            </div>
          </div>

          <button className={styles.button} type="submit">Add Doctor</button>
        </form>
      </div>
    </div>
  ) : <div>Loading...</div>;

};

export default AddDoctor;
