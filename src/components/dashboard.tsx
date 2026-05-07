import { useEffect, useState } from "react"
import { github, getGithubStats } from "../services/github"

interface GithubUser {
    login: string
    name: string
    avatar_url: string
    followers: number
    following: number
    bio: string
}

interface GithubStats {
    totalRepos: number
    totalCommits: number
    totalFiles: number
}

interface CachedData {
    user: GithubUser
    stats: GithubStats
    timestamp: number
}

export default function Dashboard() {
    const [user, setUser] = useState<GithubUser | null>(null)
    const [stats, setStats] = useState<GithubStats | null>(null)
    const [loadingUser, setLoadingUser] = useState(false)
    const [loadingStats, setLoadingStats] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadFromCache = () => {
        const cached = localStorage.getItem('github-stats')
        if (cached) {
            const data: CachedData = JSON.parse(cached)
            setUser(data.user)
            setStats(data.stats)
            return true
        }
        return false
    }

    const saveToCache = (userData: GithubUser, statsData: GithubStats) => {
        const cacheData: CachedData = {
            user: userData,
            stats: statsData,
            timestamp: Date.now()
        }
        localStorage.setItem('github-stats', JSON.stringify(cacheData))
    }

    const fetchFreshData = async () => {
        setLoadingUser(true)
        setError(null)
        
        try {
            const userData = await github("Deadends")
            setUser(userData)
            setLoadingUser(false)
            
            setLoadingStats(true)
            const statsData = await getGithubStats("Deadends")
            setStats(statsData)
            setLoadingStats(false)
            
            saveToCache(userData, statsData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
            setLoadingUser(false)
            setLoadingStats(false)
        }
    }

    useEffect(() => {
        const hasCachedData = loadFromCache()
        if (!hasCachedData) {
            fetchFreshData()
        }
    }, [])
    
    if (error) {
        return (
            <div>
                <h1>Error</h1>
                <p>{error}</p>
                <button onClick={fetchFreshData}>Retry</button>
            </div>
        )
    }
    
    if (loadingUser) {
        return <h1>Loading user...</h1>
    }
    
    if (!user) {
        return <h1>No user data</h1>
    }

    return (
        <div>
            <img
                src={user.avatar_url}
                alt={user.login}
                width="150"
            />
            <h1>{user.name}</h1>
            <p>Username: {user.login}</p>
            
            {loadingStats ? (
                <p>Loading stats... (this may take a moment)</p>
            ) : stats ? (
                <>
                    <p>Repos: {stats.totalRepos}</p>
                    <p>Total Files: {stats.totalFiles}</p>
                    <p>Total Commits: {stats.totalCommits}</p>
                </>
            ) : null}
            
            <p>Followers: {user.followers}</p>
            <p>Following: {user.following}</p>
            
            <button onClick={fetchFreshData} disabled={loadingUser || loadingStats}>
                {loadingUser || loadingStats ? 'Refreshing...' : 'Refresh Stats'}
            </button>
        </div>
    )
}