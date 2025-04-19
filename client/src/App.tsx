import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
} from "date-fns";
import "./App.css";
import { ActivityGraph } from "./components/ActivityGraph";
import Auth from "./components/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import type { Shift } from "shared";

const API_URL = "https://jubilapi.pcdhebrail.ovh";

function HomePage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dailyShifts, setDailyShifts] = useState<Shift[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  useEffect(() => {
    fetchShifts();
  }, [token]); // Refetch when token changes

  useEffect(() => {
    calculateTotals();
    setDateShifts(date);
  }, [shifts, date]);

  const fetchShifts = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/shifts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      } else if (response.status === 401 || response.status === 403) {
        // Handle unauthorized error by logging out and redirecting
        logout();
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const handleAddShift = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      alert("Les horaires ne sont pas corrects");
      return;
    }

    const shiftData = {
      date,
      startTime,
      endTime,
      comment,
      userId: user?.id,
    };

    try {
      const response = await fetch(`${API_URL}/api/shifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shiftData),
      });

      if (response.ok) {
        setStartTime("");
        setEndTime("");
        setComment("");
        fetchShifts();
      } else if (response.status === 401 || response.status === 403) {
        logout();
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error adding shift:", error);
    }
  };

  const startEditing = (shift: Shift) => {
    setEditingId(shift.id);
    setEditingShift({ ...shift });
  };

  const handleEdit = async (id: number, editedShift: Partial<Shift>) => {
    try {
      const response = await fetch(`${API_URL}/api/shifts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedShift),
      });

      if (response.ok) {
        setEditingId(null);
        setEditingShift(null);
        fetchShifts();
      } else if (response.status === 401 || response.status === 403) {
        logout();
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error updating shift:", error);
    }
  };

  const setDateShifts = (selectedDate: string) => {
    const filteredShifts = shifts.filter(
      (shift) => shift.date === selectedDate,
    );
    setDailyShifts(filteredShifts);
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer le créneau ?")) {
      const response = await fetch(`${API_URL}/api/shifts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchShifts();
      } else if (response.status === 401 || response.status === 403) {
        logout();
        navigate("/auth");
      }
    }
  };

  const calculateTotals = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    let weekHours = 0;
    let monthHours = 0;

    shifts.forEach((shift) => {
      const shiftDate = new Date(shift.date);
      const start = new Date(`${shift.date}T${shift.startTime}`);
      const end = new Date(`${shift.date}T${shift.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (shiftDate >= weekStart && shiftDate <= weekEnd) {
        weekHours += hours;
      }

      if (shiftDate >= monthStart && shiftDate <= monthEnd) {
        monthHours += hours;
      }
    });

    setWeeklyTotal(parseFloat(weekHours.toFixed(2)));
    setMonthlyTotal(parseFloat(monthHours.toFixed(2)));
  };

  const groupShiftDurationByDay = () => {
    const durationByDay: { [key: string]: number } = {};

    shifts.forEach((shift) => {
      const start = new Date(`${shift.date}T${shift.startTime}`);
      const end = new Date(`${shift.date}T${shift.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (durationByDay[shift.date]) {
        durationByDay[shift.date] += hours;
      } else {
        durationByDay[shift.date] = hours;
      }
    });

    return durationByDay;
  };

  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof Shift,
  ) => {
    setEditingShift((prev: Shift | null) =>
      prev ? { ...prev, [field]: e.target.value } : prev,
    );
  };

  const differenceToFullWeek = 39 - weeklyTotal;

  return (
    <div className="container">
      <h1>Jubil-à-Temps !</h1>
      <div className="user-info">
        {user && (
          <>
            <p>Connecté en tant que: {user.name}</p>
            <button onClick={logout} className="logout-btn">
              Se déconnecter
            </button>
          </>
        )}
      </div>
      <div className="summary">
        <div className="summary-box">
          <h3>Total de la semaine</h3>
          <p>{formatTime(weeklyTotal)}</p>
          {differenceToFullWeek === 0 && (
            <p style={{ color: "green" }}>Semaine complète</p>
          )}
          {differenceToFullWeek > 0 && (
            <p style={{ color: "red" }}>
              Reste {formatTime(differenceToFullWeek)} à faire
            </p>
          )}
          {differenceToFullWeek < 0 && (
            <p style={{ color: "red" }}>
              Dépassé de {formatTime(-differenceToFullWeek)}
            </p>
          )}
        </div>
        <div className="summary-box">
          <h3>Total du mois</h3>
          <p>{formatTime(monthlyTotal)}</p>
        </div>
      </div>
      <ActivityGraph data={groupShiftDurationByDay()} />
      <div className="main-content">
        <div className="add-shift">
          <h2>Ajouter créneau</h2>
          <form onSubmit={handleAddShift}>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={date}
                onChange={handleDateChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Début:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Fin:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Commentaire:</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
            <button type="submit" className="btn">
              Ajouter créneau
            </button>
          </form>
        </div>
        <div className="daily-shifts">
          <h2>Créneaux du {date}</h2>
          {dailyShifts.length > 0 ? (
            <ul className="shifts-list">
              {dailyShifts.map((shift, index) => (
                <li key={index}>
                  <span>
                    {shift.startTime} - {shift.endTime}
                  </span>
                  <span className="shift-comment"> {shift.comment || "-"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucun créneau sur la date sélectionnée.</p>
          )}
        </div>
      </div>
      <div className="history">
        <h2>Historique</h2>
        {shifts.length > 0 ? (
          <div className="shifts-history">
            {shifts.map((shift) => {
              const start = new Date(`${shift.date}T${shift.startTime}`);
              const end = new Date(`${shift.date}T${shift.endTime}`);
              const hours =
                (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              const isEditing = editingId === shift.id;
              return (
                <div key={shift.id} className="shift-card">
                  <div className="shift-card-header">
                    <span className="shift-date">
                      {isEditing ? (
                        <input
                          type="date"
                          defaultValue={shift.date}
                          onBlur={(e) =>
                            editingShift &&
                            handleEdit(shift.id, {
                              ...editingShift,
                              date: e.target.value,
                            })
                          }
                          onChange={(e) => handleInputChange(e, "date")}
                        />
                      ) : (
                        format(new Date(shift.date), "dd MMM yyyy")
                      )}
                    </span>
                    <div className="card-actions">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditing(shift)}
                          className="edit-btn"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(shift.id)}
                        className="delete-btn"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                  <div className="shift-card-body">
                    <div className="shift-time">
                      {isEditing ? (
                        <>
                          <input
                            type="time"
                            defaultValue={shift.startTime}
                            onBlur={(e) =>
                              editingShift &&
                              handleEdit(shift.id, {
                                ...editingShift,
                                startTime: e.target.value,
                              })
                            }
                            onChange={(e) => handleInputChange(e, "startTime")}
                          />
                          <span className="separator">→</span>
                          <input
                            type="time"
                            defaultValue={shift.endTime}
                            onBlur={(e) =>
                              editingShift &&
                              handleEdit(shift.id, {
                                ...editingShift,
                                endTime: e.target.value,
                              })
                            }
                            onChange={(e) => handleInputChange(e, "endTime")}
                          />
                        </>
                      ) : (
                        <>
                          <span>{shift.startTime}</span>
                          <span className="separator">→</span>
                          <span>{shift.endTime}</span>
                        </>
                      )}
                    </div>
                    <div className="shift-duration">{formatTime(hours)}</div>
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={shift.comment || ""}
                        onBlur={(e) =>
                          editingShift &&
                          handleEdit(shift.id, {
                            ...editingShift,
                            comment: e.target.value,
                          })
                        }
                        onChange={(e) => handleInputChange(e, "comment")}
                        className="shift-comment-input"
                        placeholder="Commentaire"
                      />
                    ) : (
                      shift.comment && (
                        <div className="shift-card-comment">
                          {shift.comment}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>Pas de créneau enregistré pour le moment</p>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
