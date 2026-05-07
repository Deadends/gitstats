interface GithubUser {
    login: string
    name: string
    avatar_url: string
    followers: number
    following: number
    bio: string
    public_repos: number
}

interface GithubStats {
    totalRepos: number
    totalCommits: number
    totalFiles: number
}

export async function github(username: string): Promise<GithubUser> {
    const response = await fetch(`/api/user?username=${username}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
    }
    return response.json()
}

export async function getGithubStats(username: string): Promise<GithubStats> {
    const response = await fetch(`/api/stats?username=${username}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
    }
    return response.json()
}