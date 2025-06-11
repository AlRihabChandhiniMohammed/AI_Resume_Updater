// pages/resume/[username].tsx
import React from 'react';

export async function getServerSideProps(context) {
  const { username } = context.params;

  const userRes = await fetch(`https://api.github.com/users/${username}`);
  const reposRes = await fetch(`https://api.github.com/users/${username}/repos`);

  if (!userRes.ok || !reposRes.ok) {
    return { notFound: true };
  }

  const user = await userRes.json();
  const repos = await reposRes.json();

  return {
    props: {
      user,
      repos: repos.slice(0, 5), // top 5 recent repos
    },
  };
}

export default function ResumePage({ user, repos }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>{user.name}'s Resume</h1>
      <img src={user.avatar_url} alt="avatar" width={100} style={{ borderRadius: '50%' }} />
      <p><strong>Username:</strong> {user.login}</p>
      <p><strong>Bio:</strong> {user.bio || "No bio available"}</p>
      <p><strong>Public Repositories:</strong> {user.public_repos}</p>

      <h2>Top Projects</h2>
      <ul>
        {repos.map((repo: any) => (
          <li key={repo.id}>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </a> - ⭐ {repo.stargazers_count}
            <p>{repo.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
