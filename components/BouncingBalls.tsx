'use client'

import { useEffect, useRef, useState } from 'react'
import LoadingOverlay from './LoadingOverlay'
import * as THREE from 'three'

export default function BouncingBalls() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    if (!containerRef.current) return

    // Start with scene setup progress
    setProgress(10)

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    setProgress(20)
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    setProgress(30)
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0) // Transparent background
    containerRef.current.appendChild(renderer.domElement)

    setProgress(40)
    
    // Create balls with brand colors
    const balls = [
      // Original balls
      { color: 0x1E3C96, position: new THREE.Vector3(-12, 8, -8) }, // Blue
      { color: 0x008242, position: new THREE.Vector3(12, -8, 8) },  // Green
      { color: 0xFFB81C, position: new THREE.Vector3(-8, -12, 4) },  // Yellow
      { color: 0xE31837, position: new THREE.Vector3(8, 12, -4) },  // Red
      // New balls with alternating colors
      { color: 0x1E3C96, position: new THREE.Vector3(14, 0, 6) },   // Blue
      { color: 0x008242, position: new THREE.Vector3(-14, 0, -6) }, // Green
      { color: 0xFFB81C, position: new THREE.Vector3(0, 14, -8) },  // Yellow
      { color: 0xE31837, position: new THREE.Vector3(0, -14, 8) }   // Red
    ].map(({ color, position }) => {
      const geometry = new THREE.SphereGeometry(0.7, 32, 32)
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 100,
        specular: 0x444444
      })
      const ball = new THREE.Mesh(geometry, material)
      ball.position.copy(position)
      // Set consistent speed with random direction
      const speed = 0.08
      const angle = Math.random() * Math.PI * 2
      const angle2 = Math.random() * Math.PI * 2
      ball.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.sin(angle2) * speed
      )
      scene.add(ball)
      return ball
    })

    setProgress(60)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.set(-5, -5, 2)
    scene.add(pointLight)

    // Position camera
    camera.position.z = 35

    // Animation variables
    const bounds = {
      minX: -16,
      maxX: 16,
      minY: -16,
      maxY: 16,
      minZ: -16,
      maxZ: 16
    }

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Update ball positions
      balls.forEach(ball => {
        ball.position.add(ball.userData.velocity)

        // Perfect elastic bouncing
        const speed = Math.sqrt(
          ball.userData.velocity.x ** 2 + 
          ball.userData.velocity.y ** 2 + 
          ball.userData.velocity.z ** 2
        )

        if (ball.position.x <= bounds.minX || ball.position.x >= bounds.maxX) {
          ball.userData.velocity.x *= -1
          // Normalize speed
          const currentSpeed = Math.sqrt(
            ball.userData.velocity.x ** 2 + 
            ball.userData.velocity.y ** 2 + 
            ball.userData.velocity.z ** 2
          )
          ball.userData.velocity.multiplyScalar(speed / currentSpeed)
        }
        if (ball.position.y <= bounds.minY || ball.position.y >= bounds.maxY) {
          ball.userData.velocity.y *= -1
          // Normalize speed
          const currentSpeed = Math.sqrt(
            ball.userData.velocity.x ** 2 + 
            ball.userData.velocity.y ** 2 + 
            ball.userData.velocity.z ** 2
          )
          ball.userData.velocity.multiplyScalar(speed / currentSpeed)
        }
        if (ball.position.z <= bounds.minZ || ball.position.z >= bounds.maxZ) {
          ball.userData.velocity.z *= -1
          // Normalize speed
          const currentSpeed = Math.sqrt(
            ball.userData.velocity.x ** 2 + 
            ball.userData.velocity.y ** 2 + 
            ball.userData.velocity.z ** 2
          )
          ball.userData.velocity.multiplyScalar(speed / currentSpeed)
        }

        // Add slight rotation for more visual interest
        ball.rotation.x += ball.userData.velocity.x * 0.1
        ball.rotation.y += ball.userData.velocity.y * 0.1
      })

      // Slowly rotate camera
      camera.position.x = Math.sin(Date.now() * 0.0002) * 35
      camera.position.z = Math.cos(Date.now() * 0.0002) * 35
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    setProgress(80)
    animate()
    
    // Small delay before removing loading screen to ensure everything is rendered
    setTimeout(() => {
      setProgress(100)
      setIsLoading(false)
    }, 500)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      balls.forEach(ball => {
        ball.geometry.dispose()
        ;(ball.material as THREE.Material).dispose()
      })
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <>
      <div 
        ref={containerRef} 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{ 
          opacity: 0.2,
          background: 'transparent',
          mixBlendMode: 'normal'
        }}
      />
      <LoadingOverlay isLoading={isLoading} progress={progress} />
    </>
  )
}
