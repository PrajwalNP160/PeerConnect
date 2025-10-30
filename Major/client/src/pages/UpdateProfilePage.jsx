import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance";
import FileUpload from "../components/FileUpload";
import { X } from "lucide-react";

const UpdateProfilePage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [updateData, setUpdateData] = useState({
    skills: "",
    projects: "",
    location: "",
    role: "",
    availability: "",
    skillsToLearn: "",
    experience: "",
    experienceType: "",
  });

  // Load profile into form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await axiosInstance.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const u = res.data.user;
        setUpdateData({
          skills: u.skills?.join(", ") || "",
          projects:
            u.projects
              ?.map((p) => (typeof p === "string" ? p : p.gitHubUrl))
              .join(", ") || "",
          location: u.location || "",
          role: u.role || "",
          availability: u.availability?.join(", ") || "",
          skillsToLearn: u.skillsToLearn?.join(", ") || "",
          experience: u.experience || "",
          experienceType: u.experienceType || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [getToken]);

  const handleChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = await getToken();

    // ✅ Convert comma-separated strings into arrays
    const payload = {
      ...updateData,
      skills: updateData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      projects: updateData.projects
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((projectName) => ({
          name: projectName,
          gitHubUrl: "", // Default empty URL, user can edit later
        })),
      availability: updateData.availability
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      skillsToLearn: updateData.skillsToLearn
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      await axiosInstance.put("/user/update-profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/profile"); // back to profile page
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      alert("Profile update failed.");
    }
  };

  return (
    <div className="absolute top-20 left-0 right-0 z-40 flex justify-center px-4">
      {/* Backdrop below navbar */}
      <div
        className="absolute top-16 left-0 right-0 bottom-0 bg-gray-100 bg-opacity-60 backdrop-blur-sm"
        onClick={() => navigate(-1)}
      />

      {/* Modal */}
      <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 border border-gray-200 z-50">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X />
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Update Profile</h2>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {Object.entries(updateData).map(([key, value]) => {
            const isTextArea = [
              "skills",
              "skillsToLearn",
              "projects",
              "availability",
            ].includes(key);

            if (key === "experienceType") {
              return (
                <select
                  key={key}
                  name={key}
                  value={value}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md"
                >
                  <option value="">Select experience type</option>
                  <option value="Internship">Internship</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Student">Student</option>
                </select>
              );
            }

            if (isTextArea) {
              return (
                <textarea
                  key={key}
                  name={key}
                  value={value}
                  onChange={handleChange}
                  placeholder={`Enter ${key} (comma separated)`}
                  className="w-full border p-2 rounded-md"
                />
              );
            }

            return (
              <input
                key={key}
                name={key}
                value={value}
                onChange={handleChange}
                placeholder={`Enter ${key}`}
                className="w-full border p-2 rounded-md"
              />
            );
          })}

          {/* Certificate Upload Section */}
          <div className="mt-6">
            <FileUpload
              type="certificate"
              title="Upload Certificates"
              description="Upload your skill certificates (PDF, JPG, PNG)"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={10}
              multiple={true}
              onUploadSuccess={(files) => {
                console.log("Certificates uploaded:", files);
                alert("Certificates uploaded successfully!");
              }}
              onUploadError={(error) => {
                console.error("Certificate upload failed:", error);
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 mt-6"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfilePage;
