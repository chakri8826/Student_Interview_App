import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

const parseAnalysis = (analysis: any) => {
    if (!analysis) return null;
    if (typeof analysis === "object") return analysis;
    try {
        const match = (analysis as string).match(/\{[\s\S]*\}/);
        const jsonText = match ? match[0] : analysis;
        return JSON.parse(jsonText as string);
    } catch {
        return { summary: analysis } as any;
    }
};

const ScreeningResult = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const passedAnalysis = location?.state?.analysis;

    const { data: screening, isLoading, isError } = useQuery({
        queryKey: ["screening", id],
        queryFn: async () => {
            const res = await api.get(`/api/v1/screenings/${id}`);
            return res.data;
        },
        enabled: !!id && !passedAnalysis, // skip fetch if we already have analysis
    });

    const ai = parseAnalysis(passedAnalysis || screening?.analysis);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="max-w-2xl mx-auto mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>CV Screening Report</CardTitle>
                            <CardDescription>
                                AI-generated analysis and recommendations for your CV
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading && !passedAnalysis ? (
                                <div className="py-12 text-center text-gray-600">Loading analysis...</div>
                            ) : isError && !passedAnalysis ? (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Failed to load screening result. Please try again.
                                    </AlertDescription>
                                </Alert>
                            ) : ai ? (
                                <div className="space-y-6">
                                    {ai.summary && (
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">Summary</h3>
                                            <p className="text-gray-800 whitespace-pre-wrap">{ai.summary}</p>
                                        </div>
                                    )}
                                    {ai.roles && (
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">Potential Roles</h3>
                                            <ul className="list-disc ml-6">
                                                {ai.roles.map((role: string, idx: number) => (
                                                    <li key={idx}>{role}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {ai.skills && (
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">Key Skills</h3>
                                            <ul className="list-disc ml-6">
                                                {ai.skills.map((skill: string, idx: number) => (
                                                    <li key={idx}>{skill}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {ai.improvements && (
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">Improvement Suggestions</h3>
                                            <ul className="list-disc ml-6">
                                                {ai.improvements.map((imp: string, idx: number) => (
                                                    <li key={idx}>{imp}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Alert>
                                    <AlertDescription>No analysis returned. Try again.</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ScreeningResult;
