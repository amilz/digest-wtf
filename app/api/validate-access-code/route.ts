import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { accessCode } = await request.json()
    
    if (accessCode === process.env.ACCESS_CODE) {
      return NextResponse.json({ valid: true })
    }
    
    return NextResponse.json({ valid: false }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
} 