import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [showDownload, setShowDownload] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !username) {
      alert('Please upload a resume and enter your GitHub username.');
      return;
    }

    setLoading(true);
    setShowDownload(false);

    try {
      // Step 1: Preview GitHub Projects
      const githubRes = await fetch(`https://api.github.com/users/${username}/repos`);
      const githubData = await githubRes.json();

      if (!Array.isArray(githubData)) {
        alert('GitHub user not found.');
        setLoading(false);
        return;
      }

      const topRepos = githubData.slice(0, 5).map((repo: any) =>
        `• ${repo.name}: ${repo.description || 'No description'}`
      );

      setProjects(topRepos);
      setShowDownload(true);
    } catch (err) {
      alert('Error fetching GitHub data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !username) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('username', username);

    const response = await fetch('/api/update-resume', {
      method: 'POST',
      body: formData,
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'updated_resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1>Auto-Updating Resume</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>
          Upload Resume (PDF):
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>

        <label>
          GitHub Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Fetching...' : 'Preview Projects'}
        </button>
      </form>

      {projects.length > 0 && (
        <div style={styles.projectBox}>
          <h3>Projects to Add:</h3>
          <ul>
            {projects.map((proj, idx) => (
              <li key={idx}>{proj}</li>
            ))}
          </ul>

          <button onClick={handleDownload} disabled={loading}>
            {loading ? 'Processing...' : 'Download Updated Resume'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '2rem auto',
    fontFamily: 'Arial, sans-serif',
    padding: '2rem',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: '#f7f7f7',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  projectBox: {
    padding: '1rem',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
  },
};
