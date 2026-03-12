import { useState, useEffect, FormEvent } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

// API response types
interface ScoreBucket {
  bucket: string
  count: number
}

interface TimelineEntry {
  date: string
  submissions: number
}

interface PassRateEntry {
  task: string
  avg_score: number
  attempts: number
}

interface LabOption {
  id: string
  title: string
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const AVAILABLE_LABS: LabOption[] = [
  { id: 'lab-01', title: 'Lab 01' },
  { id: 'lab-02', title: 'Lab 02' },
  { id: 'lab-03', title: 'Lab 03' },
  { id: 'lab-04', title: 'Lab 04' },
]

const STORAGE_KEY = 'api_key'
const LAB_STORAGE_KEY = 'selected_lab'

function Dashboard() {
  const [token] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [selectedLab, setSelectedLab] = useState(
    () => localStorage.getItem(LAB_STORAGE_KEY) ?? 'lab-04',
  )

  // Score distribution state
  const [scoresState, setScoresState] = useState<FetchState>({ status: 'idle' })
  const [scoreData, setScoreData] = useState<ScoreBucket[]>([])

  // Timeline state
  const [timelineState, setTimelineState] = useState<FetchState>({
    status: 'idle',
  })
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([])

  // Pass rates state
  const [passRatesState, setPassRatesState] = useState<FetchState>({
    status: 'idle',
  })
  const [passRatesData, setPassRatesData] = useState<PassRateEntry[]>([])

  // Fetch score distribution
  useEffect(() => {
    if (!token || !selectedLab) return

    setScoresState({ status: 'loading' })

    fetch(`/analytics/scores?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: ScoreBucket[]) => {
        setScoreData(data)
        setScoresState({ status: 'success' })
      })
      .catch((err: Error) =>
        setScoresState({ status: 'error', message: err.message }),
      )
  }, [token, selectedLab])

  // Fetch timeline
  useEffect(() => {
    if (!token || !selectedLab) return

    setTimelineState({ status: 'loading' })

    fetch(`/analytics/timeline?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: TimelineEntry[]) => {
        setTimelineData(data)
        setTimelineState({ status: 'success' })
      })
      .catch((err: Error) =>
        setTimelineState({ status: 'error', message: err.message }),
      )
  }, [token, selectedLab])

  // Fetch pass rates
  useEffect(() => {
    if (!token || !selectedLab) return

    setPassRatesState({ status: 'loading' })

    fetch(`/analytics/pass-rates?lab=${selectedLab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: PassRateEntry[]) => {
        setPassRatesData(data)
        setPassRatesState({ status: 'success' })
      })
      .catch((err: Error) =>
        setPassRatesState({ status: 'error', message: err.message }),
      )
  }, [token, selectedLab])

  function handleLabChange(e: FormEvent<HTMLSelectElement>) {
    const lab = e.currentTarget.value
    setSelectedLab(lab)
    localStorage.setItem(LAB_STORAGE_KEY, lab)
  }

  // Bar chart data for score distribution
  const barChartData = {
    labels: scoreData.map((s) => s.bucket),
    datasets: [
      {
        label: 'Number of Students',
        data: scoreData.map((s) => s.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Score Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  // Line chart data for timeline
  const lineChartData = {
    labels: timelineData.map((t) => t.date),
    datasets: [
      {
        label: 'Submissions',
        data: timelineData.map((t) => t.submissions),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  }

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Submissions Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  if (!token) {
    return (
      <div className="dashboard-container">
        <h2>Dashboard</h2>
        <p>Please enter your API key in the main page to view analytics.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Analytics Dashboard</h2>
        <div className="lab-selector">
          <label htmlFor="lab-select">Select Lab: </label>
          <select
            id="lab-select"
            value={selectedLab}
            onChange={handleLabChange}
          >
            {AVAILABLE_LABS.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Score Distribution Chart */}
        <div className="dashboard-card">
          <h3>Score Distribution</h3>
          {scoresState.status === 'loading' && <p>Loading...</p>}
          {scoresState.status === 'error' && (
            <p className="error">Error: {scoresState.message}</p>
          )}
          {scoresState.status === 'success' && (
            <canvas>
              <Bar data={barChartData} options={barChartOptions} />
            </canvas>
          )}
        </div>

        {/* Timeline Chart */}
        <div className="dashboard-card">
          <h3>Submissions Timeline</h3>
          {timelineState.status === 'loading' && <p>Loading...</p>}
          {timelineState.status === 'error' && (
            <p className="error">Error: {timelineState.message}</p>
          )}
          {timelineState.status === 'success' && (
            <canvas>
              <Line data={lineChartData} options={lineChartOptions} />
            </canvas>
          )}
        </div>

        {/* Pass Rates Table */}
        <div className="dashboard-card full-width">
          <h3>Pass Rates by Task</h3>
          {passRatesState.status === 'loading' && <p>Loading...</p>}
          {passRatesState.status === 'error' && (
            <p className="error">Error: {passRatesState.message}</p>
          )}
          {passRatesState.status === 'success' && (
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Avg Score</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {passRatesData.map((entry) => (
                  <tr key={entry.task}>
                    <td>{entry.task}</td>
                    <td>{entry.avg_score.toFixed(1)}</td>
                    <td>{entry.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
