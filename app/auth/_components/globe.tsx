'use client'

import { useEffect, useRef } from 'react'
import createGlobe, { type Marker, type Arc } from 'cobe'
import { useSpring } from 'react-spring'

const arcs: Arc[] = [
  {
    id: 'cdn-arc-1',
    from: [38.95, -77.45],
    to: [49.01, 2.55],
  },
  {
    id: 'cdn-arc-2',
    from: [37.62, -122.38],
    to: [35.55, 139.78],
  },
  {
    id: 'cdn-arc-3',
    from: [49.01, 2.55],
    to: [1.36, 103.99],
  },
  {
    id: 'cdn-arc-4',
    from: [38.95, -77.45],
    to: [-23.43, -46.47],
  },
  {
    id: 'cdn-arc-5',
    from: [35.55, 139.78],
    to: [-33.95, 151.18],
  },
  {
    id: 'cdn-arc-6',
    from: [49.01, 2.55],
    to: [19.09, 72.87],
  },
]

const markers: Marker[] = [
  {
    id: 'cdn-iad',
    location: [38.95, -77.45],
    size: 0.012,
  },
  {
    id: 'cdn-sfo',
    location: [37.62, -122.38],
    size: 0.012,
  },
  {
    id: 'cdn-cdg',
    location: [49.01, 2.55],
    size: 0.012,
  },
  {
    id: 'cdn-hnd',
    location: [35.55, 139.78],
    size: 0.012,
  },
  {
    id: 'cdn-syd',
    location: [-33.95, 151.18] as [number, number],
    size: 0.012,
  },
  {
    id: 'cdn-gru',
    location: [-23.43, -46.47] as [number, number],
    size: 0.012,
  },
  {
    id: 'cdn-sin',
    location: [1.36, 103.99] as [number, number],
    size: 0.012,
  },
  {
    id: 'cdn-arn',
    location: [59.65, 17.93] as [number, number],
    size: 0.012,
  },
  {
    id: 'cdn-dub',
    location: [53.43, -6.25] as [number, number],
    size: 0.012,
  },
  {
    id: 'cdn-bom',
    location: [19.09, 72.87] as [number, number],
    size: 0.012,
  },
]

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const dragOffset = useRef({ phi: 0, theta: 0 })
  const velocity = useRef({ phi: 0, theta: 0 })

  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)

  const isPausedRef = useRef(false)

  const [spring] = useSpring(() => ({
    theta: 0.2,
    dark: 0,
    mapBrightness: 10,
    mr: 0,
    mg: 0,
    mb: 0,
    br: 1,
    bg: 1,
    bb: 1,
    ar: 0,
    ag: 0,
    ab: 0,
    markerSize: 0.012,
    markerElevation: 0.02,
    config: { mass: 1, tension: 120, friction: 20 },
  }))

  const springRef = useRef(spring)
  const speedRef = useRef(1)

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    let phi = 0
    const width = canvasRef.current.offsetWidth

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 640 ? 1.8 : 2
    )
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width: width,
      height: width,
      phi: 0,
      theta: 0.2,
      dark: 0,
      diffuse: 1.5,
      mapSamples: 16000,
      mapBrightness: 10,
      baseColor: [1, 1, 1],
      markerColor: [0, 0, 0],
      glowColor: [0.94, 0.93, 0.91],
      markerElevation: 0.02,
      markers,
      arcs,
      arcColor: [0, 0, 0],
      arcWidth: 0.5,
      arcHeight: 0.25,
      opacity: 0.7,
    })

    let animationId: number
    const animate = () => {
      const s = springRef.current
      if (!isPausedRef.current) {
        phi += 0.003 * speedRef.current
        // Apply momentum with decay
        if (
          Math.abs(velocity.current.phi) > 0.0001 ||
          Math.abs(velocity.current.theta) > 0.0001
        ) {
          phiOffsetRef.current += velocity.current.phi
          thetaOffsetRef.current += velocity.current.theta
          velocity.current.phi *= 0.95
          velocity.current.theta *= 0.95
        }
        // Soft spring back for theta limits
        const thetaMin = -0.4,
          thetaMax = 0.4
        if (thetaOffsetRef.current < thetaMin) {
          thetaOffsetRef.current += (thetaMin - thetaOffsetRef.current) * 0.1
        } else if (thetaOffsetRef.current > thetaMax) {
          thetaOffsetRef.current += (thetaMax - thetaOffsetRef.current) * 0.1
        }
      }
      globe.update({
        phi: phi + phiOffsetRef.current + dragOffset.current.phi,
        theta:
          s.theta.get() + thetaOffsetRef.current + dragOffset.current.theta,
        dark: s.dark.get(),
        mapBrightness: s.mapBrightness.get(),
        markerColor: [s.mr.get(), s.mg.get(), s.mb.get()],
        baseColor: [s.br.get(), s.bg.get(), s.bb.get()],
        arcColor: [s.ar.get(), s.ag.get(), s.ab.get()],
        markerElevation: s.markerElevation.get(),
        markers,
        arcs,
      })
      animationId = requestAnimationFrame(animate)
    }
    animate()

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = '1'
      }
    })

    return () => {
      cancelAnimationFrame(animationId)
      globe.destroy()
    }
  }, [])

  return (
    <div className='flex items-center justify-center flex-1 overflow-hidden'>
      <div className='flex items-center justify-center w-[600px]'>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
