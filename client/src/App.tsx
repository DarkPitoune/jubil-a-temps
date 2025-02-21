import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth
} from "date-fns";
import "./App.css";

type Shift = {
  id: number
  date: string;
  startTime: string;
  endTime: string;
};

const API_URL = "https://jubilapi.pcdhebrail.ovh"

function App() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dailyShifts, setDailyShifts] = useState<Shift[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    fetchShifts();
  }, []);

  useEffect(() => {
    calculateTotals();
    setDateShifts(date);
  }, [shifts, date]);

  const fetchShifts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shifts`);
      const data = await response.json();
      setShifts(data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const handleAddShift = async (e) => {
    e.preventDefault();

    if (!startTime || !endTime) {
      alert("Les horaires ne sont pas corrects");
      return;
    }

    const shiftData = {
      date,
      startTime,
      endTime
    };

    try {
      const response = await fetch(`${API_URL}/api/shifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(shiftData)
      });

      if (response.ok) {
        setStartTime("");
        setEndTime("");
        fetchShifts();
      }
    } catch (error) {
      console.error("Error adding shift:", error);
    }
  };

  const setDateShifts = (selectedDate: string) => {
    const filteredShifts = shifts.filter((shift) => shift.date === selectedDate);
    setDailyShifts(filteredShifts);
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer le créneau ?") {
      const response = await fetch(`${API_URL}/api/shifts/${id}`, {
          method: "DELETE",
        });
  
        if (response.ok) {
          fetchShifts();
        }
    }
  }

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

  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="container">
      <h1>Jubil-à-Temps !</h1>

      <div className="summary">
        <div className="summary-box">
          <h3>Total de la semaine</h3>
          <p>{formatTime(weeklyTotal)}</p>
        </div>
        <div className="summary-box">
          <h3>Total du mois</h3>
          <p>{formatTime(monthlyTotal)}</p>
        </div>
      </div>

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
                </li>
              ))}
            </ul>
          ) : (
            <p>No shifts recorded for this date.</p>
          )}
        </div>
      </div>

      <div className="history">
        <h2>Historique</h2>
        {shifts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Durée</th>
                <th>Supprimer</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const start = new Date(`${shift.date}T${shift.startTime}`);
                const end = new Date(`${shift.date}T${shift.endTime}`);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                return (
                  <tr key={shift.id}>
                    <td>{format(new Date(shift.date), "dd MM, yyyy")}</td>
                    <td>{shift.startTime}</td>
                    <td>{shift.endTime}</td>
                    <td>{formatTime(hours)}</td>
                    <td><button type="button" onClick={()=>handleDelete(shift.id)}>❌</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>Pas de créneau enregistré pour le moment</p>
        )}
      </div>
    </div>
  );
}

export default App;
