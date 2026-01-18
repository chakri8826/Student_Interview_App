import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

const Profile = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: profileAPI.getProfile,
    })

    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [city, setCity] = useState('')

    useEffect(() => {
        const user = profile?.data?.user
        if (user) {
            setFullName(user.name || '')
            setPhone(user.phone || '')
            setCity(user.city || '')
        }
    }, [profile])

    const { mutate: saveProfile, isPending } = useMutation({
        mutationFn: () => profileAPI.updateProfile({ full_name: fullName, phone, city }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['profile'] })
            toast.success('Profile updated')
            navigate('/dashboard')
        },
        onError: () => {
            toast.error('Failed to update profile')
        },
    })

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading profile...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-3xl mx-auto p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Avatar>
                        <AvatarFallback>{fullName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
                        <p className="text-slate-600">Update your personal information</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>These details are used across the app</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 555 123 4567" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                                <Button onClick={() => saveProfile()} disabled={isPending}>
                                    {isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Profile


