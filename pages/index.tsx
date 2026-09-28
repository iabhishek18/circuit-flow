"use client"


import type React from "react"


import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"


// Tile types representing different wire patterns
type TileType = "straight" | "corner" | "tjunction" | "cross" | "end"
type Direction = "north" | "east" | "south" | "west"
type Rotation = 0 | 90 | 180 | 270
type GameDifficulty = "easy" | "medium" | "hard"
type ThemeOption = "neon" | "sunset" | "cosmic" | "forest" | "midnight"


interface Tile {
  id: number
  type: TileType
  rotation: Rotation
  connections: Direction[]
  isPowered: boolean
  isFixed: boolean
}


// Interface for game history
interface GameState {
  tiles: Tile[]
  moveCount: number
}


// Bubble interface for background animation
interface Bubble {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
}


export default function WirePuzzlePage() {
  // Game state
  const [tiles, setTiles] = useState<Tile[]>([])
  const [isWin, setIsWin] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<GameDifficulty>("medium")
  const [powerUpdateTrigger, setPowerUpdateTrigger] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [theme, setTheme] = useState<ThemeOption>("forest")
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)


  // History for undo/redo
  const [history, setHistory] = useState<GameState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const isUndoRedoAction = useRef(false)


  // Canvas refs for background animation
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const animationFrameRef = useRef<number>(0)


  // Theme color mapping with modern color palettes
  const themeColors = {
    neon: {
      primary: "from-purple-950 via-violet-900 to-indigo-950",
      secondary: "bg-indigo-900/80",
      accent: "bg-fuchsia-600 hover:bg-fuchsia-500",
      powered: "#f0abfc", // fuchsia-300
      highlight: "border-fuchsia-400",
      button: "bg-fuchsia-600 hover:bg-fuchsia-500",
      win: "bg-fuchsia-600",
      menuBg: "bg-indigo-950/90",
      tileBg: "bg-indigo-950",
      tileHover: "hover:bg-indigo-900",
      text: "text-fuchsia-50",
      headingText: "text-white",
      bubbleColors: ["#f0abfc", "#c084fc", "#a78bfa", "#818cf8"],
      bgGlow: "0 0 80px rgba(192, 132, 252, 0.4)",
    },
    sunset: {
      primary: "from-orange-950 via-amber-900 to-red-950",
      secondary: "bg-amber-900/80",
      accent: "bg-rose-600 hover:bg-rose-500",
      powered: "#fcd34d", // amber-300
      highlight: "border-amber-400",
      button: "bg-rose-600 hover:bg-rose-500",
      win: "bg-rose-600",
      menuBg: "bg-amber-950/90",
      tileBg: "bg-amber-950",
      tileHover: "hover:bg-amber-900",
      text: "text-amber-50",
      headingText: "text-white",
      bubbleColors: ["#fcd34d", "#fdba74", "#f97316", "#f43f5e"],
      bgGlow: "0 0 80px rgba(251, 113, 133, 0.4)",
    },
    cosmic: {
      primary: "from-slate-950 via-blue-950 to-slate-950",
      secondary: "bg-slate-800/80",
      accent: "bg-cyan-600 hover:bg-cyan-500",
      powered: "#67e8f9", // cyan-300
      highlight: "border-cyan-400",
      button: "bg-cyan-600 hover:bg-cyan-500",
      win: "bg-cyan-600",
      menuBg: "bg-slate-950/90",
      tileBg: "bg-slate-950",
      tileHover: "hover:bg-slate-900",
      text: "text-slate-50",
      headingText: "text-white",
      bubbleColors: ["#67e8f9", "#22d3ee", "#0ea5e9", "#3b82f6"],
      bgGlow: "0 0 80px rgba(6, 182, 212, 0.3)",
    },
    forest: {
      primary: "from-green-950 via-emerald-900 to-teal-950",
      secondary: "bg-emerald-900/80",
      accent: "bg-lime-600 hover:bg-lime-500",
      powered: "#86efac", // green-300
      highlight: "border-lime-400",
      button: "bg-lime-600 hover:bg-lime-500",
      win: "bg-lime-600",
      menuBg: "bg-emerald-950/90",
      tileBg: "bg-emerald-950",
      tileHover: "hover:bg-emerald-900",
      text: "text-emerald-50",
      headingText: "text-white",
      bubbleColors: ["#86efac", "#4ade80", "#22c55e", "#10b981"],
      bgGlow: "0 0 80px rgba(16, 185, 129, 0.3)",
    },
    midnight: {
      primary: "from-gray-950 via-zinc-950 to-black",
      secondary: "bg-zinc-800/80",
      accent: "bg-violet-600 hover:bg-violet-500",
      powered: "#d8b4fe", // violet-300
      highlight: "border-violet-400",
      button: "bg-violet-600 hover:bg-violet-500",
      win: "bg-violet-600",
      menuBg: "bg-zinc-950/90",
      tileBg: "bg-zinc-950",
      tileHover: "hover:bg-zinc-900",
      text: "text-zinc-50",
      headingText: "text-white",
      bubbleColors: ["#d8b4fe", "#c4b5fd", "#a78bfa", "#8b5cf6"],
      bgGlow: "0 0 80px rgba(139, 92, 246, 0.3)",
    },
  }


  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }


    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)


    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])


  // Load custom fonts
  useEffect(() => {
    // Create a link element for Google Fonts
    const link = document.createElement("link")
    link.href =
      "https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&family=Orbitron:wght@400;500;700&family=Rajdhani:wght@500;600;700&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)


    // Set fonts as loaded after a short delay to ensure they're applied
    const timer = setTimeout(() => {
      setFontsLoaded(true)
    }, 500)


    return () => {
      clearTimeout(timer)
      document.head.removeChild(link)
    }
  }, [])


  // Initialize and animate background bubbles
  useEffect(() => {
    if (!canvasRef.current) return


    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return


    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }


    // Initialize bubbles
    const initBubbles = () => {
      const bubbleCount = Math.min(Math.floor(window.innerWidth * 0.03), 60)
      bubblesRef.current = []


      for (let i = 0; i < bubbleCount; i++) {
        const colors = themeColors[theme].bubbleColors
        bubblesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 50 + 15, // Larger bubbles
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.25 + 0.1, // More transparent
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }


    // Animate bubbles
    const animateBubbles = () => {
      if (!ctx || !canvas) return


      ctx.clearRect(0, 0, canvas.width, canvas.height)


      bubblesRef.current.forEach((bubble) => {
        // Draw bubble with gradient
        const gradient = ctx.createRadialGradient(bubble.x, bubble.y, 0, bubble.x, bubble.y, bubble.size)
        gradient.addColorStop(
          0,
          bubble.color +
            Math.floor(bubble.opacity * 255)
              .toString(16)
              .padStart(2, "0"),
        )
        gradient.addColorStop(1, bubble.color + "00") // Transparent at the edge


        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()


        // Update position with slight wobble
        bubble.x += bubble.speedX + (Math.random() - 0.5) * 0.1
        bubble.y += bubble.speedY + (Math.random() - 0.5) * 0.1


        // Bounce off edges with damping
        if (bubble.x < 0 || bubble.x > canvas.width) {
          bubble.speedX *= -0.9
          bubble.x = bubble.x < 0 ? 0 : canvas.width
        }
        if (bubble.y < 0 || bubble.y > canvas.height) {
          bubble.speedY *= -0.9
          bubble.y = bubble.y < 0 ? 0 : canvas.height
        }


        // Random movement changes
        if (Math.random() < 0.003) {
          bubble.speedX = (Math.random() - 0.5) * 0.3
          bubble.speedY = (Math.random() - 0.5) * 0.3
        }


        // Pulse opacity
        bubble.opacity += Math.random() * 0.005 - 0.0025
        if (bubble.opacity < 0.1) bubble.opacity = 0.1
        if (bubble.opacity > 0.35) bubble.opacity = 0.35


        // Slowly change size
        bubble.size += (Math.random() - 0.5) * 0.2
        if (bubble.size < 15) bubble.size = 15
        if (bubble.size > 65) bubble.size = 65
      })


      animationFrameRef.current = requestAnimationFrame(animateBubbles)
    }


    // Set up canvas and start animation
    resizeCanvas()
    initBubbles()
    animateBubbles()


    // Handle window resize
    window.addEventListener("resize", () => {
      resizeCanvas()
      initBubbles()
    })


    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [theme])


  // Reinitialize bubbles when theme changes
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return


    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)


    // Initialize new bubbles with new theme colors
    const bubbleCount = Math.min(Math.floor(window.innerWidth * 0.03), 60)
    bubblesRef.current = []


    for (let i = 0; i < bubbleCount; i++) {
      const colors = themeColors[theme].bubbleColors
      bubblesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 50 + 15,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.25 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
  }, [theme])


  // Get a random rotation
  const getRandomRotation = useCallback((): Rotation => {
    const rotations: Rotation[] = [0, 90, 180, 270]
    return rotations[Math.floor(Math.random() * rotations.length)]
  }, [])


  // Initialize game with random tile rotations
  const initializeGame = useCallback(() => {
    setGameStarted(true)
    setIsWin(false)
    setMoveCount(0)
    setShowSettings(false)


    // Reset history
    setHistory([])
    setHistoryIndex(-1)


    // Define initial tile configurations based on difficulty
    const initialTiles: Tile[] = [
      // Top row
      {
        id: 0,
        type: "end",
        rotation: 180, // Pointing down
        connections: ["south"],
        isPowered: false,
        isFixed: true,
      },
      {
        id: 1,
        type: "straight",
        rotation: 90, // Vertical orientation
        connections: ["north", "south"],
        isPowered: false,
        isFixed: true,
      },
      {
        id: 2,
        type: "end",
        rotation: 0, // Pointing right
        connections: ["east"],
        isPowered: false,
        isFixed: true,
      },
      // Middle row
      {
        id: 3,
        type: "corner",
        rotation: getRandomRotation(),
        connections: ["north", "east"],
        isPowered: false,
        isFixed: false,
      },
      {
        id: 4,
        type: "cross",
        rotation: 0, // Fixed center - power source
        connections: ["north", "east", "south", "west"],
        isPowered: true, // Power source
        isFixed: true,
      },
      {
        id: 5,
        type: "tjunction",
        rotation: getRandomRotation(),
        connections: ["north", "south", "west"],
        isPowered: false,
        isFixed: false,
      },
      // Bottom row
      {
        id: 6,
        type: "end",
        rotation: getRandomRotation(),
        connections: ["north"],
        isPowered: false,
        isFixed: difficulty !== "easy", // End points are fixed except in easy mode
      },
      {
        id: 7,
        type: "straight",
        rotation: getRandomRotation(),
        connections: ["east", "west"],
        isPowered: false,
        isFixed: false,
      },
      {
        id: 8,
        type: "end",
        rotation: getRandomRotation(),
        connections: ["west"],
        isPowered: false,
        isFixed: difficulty !== "easy", // End points are fixed except in easy mode
      },
    ]


    // Adjust difficulty
    if (difficulty === "easy") {
      // Make some tiles have correct rotation to start
      initialTiles[1].rotation = 0 // Straight piece already aligned
      initialTiles[7].rotation = 0 // Straight piece already aligned
    } else if (difficulty === "hard") {
      // Add more randomness and make more pieces fixed
      initialTiles.forEach((tile) => {
        if (tile.id !== 4) {
          // Don't change the power source
          tile.rotation = getRandomRotation()
          // 20% chance to make a non-end tile fixed in hard mode
          if (!tile.isFixed && tile.type !== "end" && Math.random() < 0.2) {
            tile.isFixed = true
          }
        }
      })
    }


    setTiles(initialTiles)
    updateStraightTileConnections()


    // Add initial state to history
    setHistory([{ tiles: initialTiles, moveCount: 0 }])
    setHistoryIndex(0)


    // Trigger power update after tiles are set
    setPowerUpdateTrigger((prev) => prev + 1)
  }, [difficulty, getRandomRotation])


  // Create a test scenario matching the image
  const createTestScenario = useCallback(() => {
    setGameStarted(true)
    setIsWin(false)
    setMoveCount(0)
    setShowSettings(false)


    // Reset history
    setHistory([])
    setHistoryIndex(-1)


    // Create the exact tile configuration from the image
    const testTiles: Tile[] = Array(9)
      .fill(null)
      .map((_, index) => {
        // Default tile properties
        const defaultTile: Tile = {
          id: index,
          type: "straight",
          rotation: 0,
          connections: ["east", "west"],
          isPowered: false,
          isFixed: false,
        }


        // Middle row - the tiles from the image
        if (index === 3) {
          // Left tile - end pointing down
          return {
            ...defaultTile,
            type: "end",
            rotation: 180,
            connections: ["south"],
            isFixed: true,
          }
        } else if (index === 4) {
          // Middle tile - straight vertical
          return {
            ...defaultTile,
            type: "straight",
            rotation: 90,
            connections: ["north", "south"],
            isFixed: true,
          }
        } else if (index === 5) {
          // Right tile - end pointing right
          return {
            ...defaultTile,
            type: "end",
            rotation: 0,
            connections: ["east"],
            isFixed: true,
          }
        } else if (index === 7) {
          // Add a power source in the bottom row
          return {
            ...defaultTile,
            type: "cross",
            rotation: 0,
            connections: ["north", "east", "south", "west"],
            isPowered: true,
            isFixed: true,
          }
        } else {
          // Random tiles for the rest
          return {
            ...defaultTile,
            type: ["straight", "corner", "tjunction", "end"][Math.floor(Math.random() * 4)] as TileType,
            rotation: getRandomRotation(),
            connections: index % 2 === 0 ? ["north", "east"] : ["south", "west"],
          }
        }
      })


    setTiles(testTiles)


    // Add initial state to history
    setHistory([{ tiles: testTiles, moveCount: 0 }])
    setHistoryIndex(0)


    // Trigger power update after tiles are set
    setPowerUpdateTrigger((prev) => prev + 1)
  }, [getRandomRotation])


  // Helper function to ensure straight tile has correct connections based on rotation
  const updateStraightTileConnections = () => {
    setTiles((prevTiles) => {
      return prevTiles.map((tile) => {
        if (tile.type === "straight") {
          // For vertical orientation (90° or 270°)
          if (tile.rotation === 90 || tile.rotation === 270) {
            return {
              ...tile,
              connections: ["north", "south"],
            }
          }
          // For horizontal orientation (0° or 180°)
          else {
            return {
              ...tile,
              connections: ["east", "west"],
            }
          }
        }
        return tile
      })
    })
  }


  // Return to main menu
  const returnToMainMenu = useCallback(() => {
    setGameStarted(false)
  }, [])


  // Helper to rotate connections
  const rotateConnections = (connections: Direction[], degrees: number): Direction[] => {
    const directionMap: Record<Direction, Direction[]> = {
      north: ["north", "east", "south", "west"],
      east: ["east", "south", "west", "north"],
      south: ["south", "west", "north", "east"],
      west: ["west", "north", "east", "south"],
    }


    const steps = (degrees / 90) % 4


    return connections.map((direction) => {
      return directionMap[direction][steps]
    })
  }


  // Function to rotate a tile
 const rotateTile = useCallback(
  (id: number) => {
    if (isWin || isUndoRedoAction.current) return;


    setTiles((prevTiles) => {
      const newTiles = prevTiles.map((tile) => {
        if (tile.id === id && !tile.isFixed) {
          const newRotation: Rotation = ((tile.rotation + 90) % 360) as Rotation;


          if (tile.type === "straight") {
            const newConnections: Direction[] =
              tile.rotation === 0 || tile.rotation === 180
                ? ["north", "south"]
                : ["east", "west"];


            return {
              ...tile,
              rotation: newRotation,
              connections: newConnections,
            };
          }


          const rotatedConnections = rotateConnections(tile.connections, 90);


          return {
            ...tile,
            rotation: newRotation,
            connections: rotatedConnections,
          };
        }


        return tile;
      });


      if (!isUndoRedoAction.current) {
        const updatedMoveCount = moveCount + 1;
        const trimmedHistory = history.slice(0, historyIndex + 1);


        setHistory([...trimmedHistory, { tiles: newTiles, moveCount: updatedMoveCount }]);
        setHistoryIndex(historyIndex + 1);
        setMoveCount(updatedMoveCount);
      }


      return newTiles;
    });


    setTimeout(() => {
      setPowerUpdateTrigger((prev) => prev + 1);
    }, 0);
  },
  [isWin, moveCount, history, historyIndex]
);




  // Undo last move
  const undoMove = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true


      const prevState = history[historyIndex - 1]
      setTiles(prevState.tiles)
      setMoveCount(prevState.moveCount)
      setHistoryIndex(historyIndex - 1)


      // Trigger power update
      setPowerUpdateTrigger((prev) => prev + 1)


      // Reset flag after a short delay
      setTimeout(() => {
        isUndoRedoAction.current = false
      }, 50)
    }
  }, [history, historyIndex])


  // Redo previously undone move
  const redoMove = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true


      const nextState = history[historyIndex + 1]
      setTiles(nextState.tiles)
      setMoveCount(nextState.moveCount)
      setHistoryIndex(historyIndex + 1)


      // Trigger power update
      setPowerUpdateTrigger((prev) => prev + 1)


      // Reset flag after a short delay
      setTimeout(() => {
        isUndoRedoAction.current = false
      }, 50)
    }
  }, [history, historyIndex])


  // Check if tiles are connected in the given directions
  const areConnected = useCallback((tile1: Tile, tile2: Tile, dir1: Direction, dir2: Direction): boolean => {
    return tile1.connections.includes(dir1) && tile2.connections.includes(dir2)
  }, [])


  // Propagate power through the grid
  useEffect(() => {
    if (tiles.length === 0) return


    // Create a function to calculate the new power state without directly updating state
    const calculatePowerState = () => {
      // Start with initial powered state (center tile is powered)
      const newTiles = tiles.map((tile) => ({
        ...tile,
        isPowered: tile.id === 4, // Only the center starts as powered
      }))


      // Power propagation (breadth-first search)
      let changed = true
      while (changed) {
        changed = false


        for (let i = 0; i < newTiles.length; i++) {
          const tile = newTiles[i]


          if (!tile.isPowered) continue


          // Check connections to adjacent tiles
          // Top
          if (i >= 3 && areConnected(tile, newTiles[i - 3], "north", "south") && !newTiles[i - 3].isPowered) {
            newTiles[i - 3].isPowered = true
            changed = true
          }
          // Right
          if (i % 3 < 2 && areConnected(tile, newTiles[i + 1], "east", "west") && !newTiles[i + 1].isPowered) {
            newTiles[i + 1].isPowered = true
            changed = true
          }
          // Bottom
          if (i < 6 && areConnected(tile, newTiles[i + 3], "south", "north") && !newTiles[i + 3].isPowered) {
            newTiles[i + 3].isPowered = true
            changed = true
          }
          // Left
          if (i % 3 > 0 && areConnected(tile, newTiles[i - 1], "west", "east") && !newTiles[i - 1].isPowered) {
            newTiles[i - 1].isPowered = true
            changed = true
          }
        }
      }


      return newTiles
    }


    // Calculate new power state
    const newPoweredTiles = calculatePowerState()


    // Update state with new power information
    setTiles(newPoweredTiles)


    // Check win condition (all end points powered)
    const endPoints = newPoweredTiles.filter((tile) => tile.type === "end")
    const allPowered = endPoints.every((tile) => tile.isPowered)
    if (allPowered && endPoints.length > 0) {
      setIsWin(true)
    }
  }, [powerUpdateTrigger, areConnected]) // Only run when powerUpdateTrigger changes


  // Generate SVG path for each tile type
  const getTilePath = useCallback(
    (type: TileType, rotation: Rotation, isPowered: boolean) => {
      const color = isPowered ? themeColors[theme].powered : "#6B7280"
      const activeColor = isPowered ? themeColors[theme].powered : "#9CA3AF"
      const strokeWidth = isPowered ? 8 : 6
      const glow = isPowered ? `filter: drop-shadow(0 0 4px ${themeColors[theme].powered})` : ""


      switch (type) {
        case "straight":
          return (
            <g transform={`rotate(${rotation}, 50, 50)`}>
              <path
                d="M0,50 L100,50"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: "all 0.3s ease",
                  ...(glow && { filter: `drop-shadow(0 0 4px ${themeColors[theme].powered})` }),
                }}
              />
            </g>
          )
        case "corner":
          return (
            <g transform={`rotate(${rotation}, 50, 50)`}>
              <path
                d="M0,50 L50,50 L50,0"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: "all 0.3s ease",
                  ...(glow && { filter: `drop-shadow(0 0 4px ${themeColors[theme].powered})` }),
                }}
              />
            </g>
          )
        case "tjunction":
          return (
            <g transform={`rotate(${rotation}, 50, 50)`}>
              <path
                d="M0,50 L100,50 M50,50 L50,0"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: "all 0.3s ease",
                  ...(glow && { filter: `drop-shadow(0 0 4px ${themeColors[theme].powered})` }),
                }}
              />
            </g>
          )
        case "cross":
          return (
            <g transform={`rotate(${rotation}, 50, 50)`}>
              <path
                d="M0,50 L100,50 M50,0 L50,100"
                stroke={activeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: "all 0.3s ease",
                  ...(glow && { filter: `drop-shadow(0 0 4px ${themeColors[theme].powered})` }),
                }}
              />
              {isPowered && (
                <circle
                  cx="50"
                  cy="50"
                  r="12"
                  fill={themeColors[theme].powered}
                  style={{ filter: `drop-shadow(0 0 8px ${themeColors[theme].powered})` }}
                  className="animate-pulse"
                />
              )}
            </g>
          )
        case "end":
          return (
            <g transform={`rotate(${rotation}, 50, 50)`}>
              <path
                d="M50,50 L50,0"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: "all 0.3s ease",
                  ...(glow && { filter: `drop-shadow(0 0 4px ${themeColors[theme].powered})` }),
                }}
              />
              <circle
                cx="50"
                cy="50"
                r="10"
                fill={isPowered ? themeColors[theme].powered : "#EF4444"} // Red for unpowered
                stroke={isPowered ? "none" : "#B91C1C"} // Darker red border for unpowered
                strokeWidth="2"
                style={{
                  transition: "all 0.3s ease",
                  ...(isPowered && { filter: `drop-shadow(0 0 8px ${themeColors[theme].powered})` }),
                }}
                className={isPowered ? "animate-pulse" : ""}
              />
            </g>
          )
        default:
          return null
      }
    },
    [theme],
  )


  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Dynamic animated background */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10" />


      {/* Background gradient overlay */}
      <div
        className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${themeColors[theme].primary} opacity-90 -z-5`}
        style={{ boxShadow: `inset ${themeColors[theme].bgGlow}` }}
      ></div>


      {/* Custom fonts and global styles */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { opacity: 0.2; }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes glow {
          0% { filter: drop-shadow(0 0 5px var(--glow-color)); }
          50% { filter: drop-shadow(0 0 15px var(--glow-color)); }
          100% { filter: drop-shadow(0 0 5px var(--glow-color)); }
        }
        
        @keyframes scale-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        html, body {
          font-family: 'Exo 2', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
        }
        
        h1, h2, h3, .game-title {
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        
        button, .btn-text {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        
        .btn-3d {
          transform: translateY(0);
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 0 0 rgba(0,0,0,0.3);
        }
        
        .btn-3d:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 0 rgba(0,0,0,0.3);
        }
        
        .glass-effect {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .text-shadow {
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        
        .tile-shadow {
          box-shadow: 0 8px 16px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .glow-effect {
          animation: glow 3s infinite ease-in-out;
        }
        
        .float-animation {
          animation: float 6s infinite ease-in-out;
        }
        
        .scale-pulse {
          animation: scale-pulse 2s infinite ease-in-out;
        }
        
        .high-contrast {
          text-shadow: 0 0 2px rgba(0,0,0,0.8);
        }
        
        /* Improve touch targets for mobile */
        @media (max-width: 640px) {
          .touch-target {
            min-height: 48px;
            min-width: 48px;
          }
        }
        
        /* Consistent spacing */
        .standard-spacing {
          padding: 1rem;
          margin: 1rem;
        }
        
        .standard-gap {
          gap: 1rem;
        }
        
        .standard-radius {
          border-radius: 0.75rem;
        }
      `}</style>


      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
        {!gameStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`max-w-md w-full ${themeColors[theme].menuBg} glass-effect p-8 rounded-2xl shadow-2xl border border-opacity-20 border-white text-center standard-radius`}
            style={{ boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 20px ${themeColors[theme].powered}40` }}
          >
            <motion.h1
              className={`text-4xl sm:text-5xl font-bold mb-8 ${themeColors[theme].headingText} game-title text-shadow float-animation`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Circuit Flow
            </motion.h1>


            <motion.p
              className="mb-8 text-gray-100 text-lg leading-relaxed high-contrast"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Connect the power source to all endpoints by rotating the tiles to create a continuous flow of
              electricity.
            </motion.p>


            <motion.div
              className="mb-8 flex flex-col space-y-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div>
                <label className="block text-base font-medium text-gray-100 mb-4 high-contrast">Difficulty</label>
                <div className="flex justify-center space-x-4">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDifficulty(level)}
                      className={`px-4 py-3 rounded-xl text-base font-medium transition-all touch-target ${
                        difficulty === level
                          ? `${themeColors[theme].accent} ${themeColors[theme].text}`
                          : "bg-gray-800/80 text-gray-200 hover:bg-gray-700/80"
                      } btn-3d standard-radius`}
                      style={
                        difficulty === level
                          ? ({
                              boxShadow: `0 4px 0 0 rgba(0,0,0,0.3), 0 0 10px ${themeColors[theme].powered}80`,
                              "--glow-color": themeColors[theme].powered,
                            } as React.CSSProperties)
                          : {}
                      }
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-100 mb-4 high-contrast">Theme</label>
                <div className="flex flex-wrap gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTheme("neon")}
                    className={`w-12 h-12 rounded-full bg-fuchsia-600 touch-target ${theme === "neon" ? "ring-2 ring-white" : ""}`}
                    style={theme === "neon" ? { boxShadow: "0 0 10px rgba(240, 171, 252, 0.8)" } : {}}
                    aria-label="Neon theme"
                  />
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTheme("sunset")}
                    className={`w-12 h-12 rounded-full bg-rose-600 touch-target ${theme === "sunset" ? "ring-2 ring-white" : ""}`}
                    style={theme === "sunset" ? { boxShadow: "0 0 10px rgba(251, 113, 133, 0.8)" } : {}}
                    aria-label="Sunset theme"
                  />
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTheme("cosmic")}
                    className={`w-12 h-12 rounded-full bg-cyan-600 touch-target ${theme === "cosmic" ? "ring-2 ring-white" : ""}`}
                    style={theme === "cosmic" ? { boxShadow: "0 0 10px rgba(6, 182, 212, 0.8)" } : {}}
                    aria-label="Cosmic theme"
                  />
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTheme("forest")}
                    className={`w-12 h-12 rounded-full bg-lime-600 touch-target ${theme === "forest" ? "ring-2 ring-white" : ""}`}
                    style={theme === "forest" ? { boxShadow: "0 0 10px rgba(16, 185, 129, 0.8)" } : {}}
                    aria-label="Forest theme"
                  />
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTheme("midnight")}
                    className={`w-12 h-12 rounded-full bg-[#1F1E22] touch-target ${theme === "midnight" ? "ring-2 ring-white" : ""}`}
                    style={theme === "midnight" ? { boxShadow: "0 0 10px rgba(139, 92, 246, 0.8)" } : {}}
                    aria-label="Midnight theme"
                  />
                </div>
              </div>
            </motion.div>


            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: `0 4px 0 0 rgba(0,0,0,0.3), 0 0 20px ${themeColors[theme].powered}80`,
              }}
              whileTap={{ scale: 0.95, boxShadow: "0 0 0 0 rgba(0,0,0,0.3)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              onClick={initializeGame}
              className={`w-full px-8 py-5 ${themeColors[theme].button} ${themeColors[theme].text} text-xl font-bold rounded-xl transition-all btn-3d high-contrast standard-radius scale-pulse`}
              style={
                {
                  boxShadow: `0 4px 0 0 rgba(0,0,0,0.3), 0 0 10px ${themeColors[theme].powered}40`,
                  "--glow-color": themeColors[theme].powered,
                } as React.CSSProperties
              }
            >
              Start Game
            </motion.button>
          </motion.div>
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <motion.h1
                  className={`text-2xl sm:text-3xl font-bold ${themeColors[theme].headingText} game-title text-shadow`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  Circuit Flow
                </motion.h1>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9, rotate: 0 }}
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-3 rounded-xl ${themeColors[theme].accent} transition-colors btn-3d touch-target standard-radius`}
                    style={
                      {
                        boxShadow: `0 4px 0 0 rgba(0,0,0,0.3), 0 0 5px ${themeColors[theme].powered}40`,
                        "--glow-color": themeColors[theme].powered,
                      } as React.CSSProperties
                    }
                    aria-label="Settings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.button>
                </div>
              </div>


              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`p-6 rounded-xl ${themeColors[theme].secondary} glass-effect mb-6 standard-radius`}
                      style={{ boxShadow: `0 4px 15px rgba(0,0,0,0.2), 0 0 8px ${themeColors[theme].powered}30` }}
                    >
                      <div className="flex flex-wrap justify-center gap-4 mb-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowHint(!showHint)}
                          className={`px-5 py-3 rounded-xl text-base font-medium ${
                            showHint ? "bg-white text-gray-800" : "bg-gray-700/80 text-white"
                          } btn-3d touch-target high-contrast standard-radius`}
                          style={showHint ? { boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" } : {}}
                        >
                          {showHint ? "Hide Hint" : "Show Hint"}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={initializeGame}
                          className="px-5 py-3 bg-white text-gray-800 rounded-xl text-base font-medium btn-3d touch-target high-contrast standard-radius"
                          style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" }}
                        >
                          New Game
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={returnToMainMenu}
                          className="px-5 py-3 bg-gray-700/80 text-white rounded-xl text-base font-medium btn-3d touch-target high-contrast standard-radius"
                          style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.3)" }}
                        >
                          Main Menu
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={createTestScenario}
                          className="px-5 py-3 bg-purple-600 text-white rounded-xl text-base font-medium btn-3d touch-target high-contrast standard-radius"
                          style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.3)" }}
                        >
                          Test Scenario
                        </motion.button>
                      </div>


                      <div className="flex flex-wrap gap-4 mb-4 justify-center">
                        <label className="sr-only">Theme</label>
                        <div className="flex flex-wrap gap-4 justify-center">
                          {(["neon", "sunset", "cosmic", "forest", "midnight"] as const).map((themeOption) => (
                            <motion.button
                              key={themeOption}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setTheme(themeOption)}
                              className={`w-10 h-10 rounded-full touch-target ${theme === themeOption ? "ring-2 ring-white" : ""}`}
                              style={{
                                backgroundColor:
                                  themeOption === "neon"
                                    ? "#f0abfc"
                                    : themeOption === "sunset"
                                      ? "#f97316"
                                      : themeOption === "cosmic"
                                        ? "#67e8f9"
                                        : themeOption === "forest"
                                          ? "#86efac"
                                          : themeOption === "midnight"
                                            ? "#1E2027"
                                            : "#d8b4fe",
                                boxShadow: theme === themeOption ? `0 0 8px ${themeColors[theme].powered}` : "",
                              }}
                              aria-label={`${themeOption.charAt(0).toUpperCase() + themeOption.slice(1)} theme`}
                            />
                          ))}
                        </div>
                      </div>


                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 text-base bg-gray-800/70 p-4 rounded-xl text-white high-contrast standard-radius"
                        >
                          <p>
                            Click or tap tiles to rotate them. Connect the center power source to all endpoints to win.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


              <div className="flex justify-center items-center flex-wrap gap-4 mb-6">
                <motion.div
                  className={`px-5 py-3 ${themeColors[theme].accent} ${themeColors[theme].text} glass-effect rounded-xl text-base font-medium high-contrast standard-radius`}
                  style={{
                    transform: "scale(1.05)", // permanent hover scale
                    boxShadow: `0 2px 8px rgba(0,0,0,0.2), 0 0 8px ${themeColors[theme].powered}`, // permanent glow
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  Moves: {moveCount}
                </motion.div>


                <motion.div
                  className={`px-5 py-3 ${themeColors[theme].accent} ${themeColors[theme].text} glass-effect rounded-xl text-base font-medium high-contrast standard-radius`}
                  style={{
                    transform: "scale(1.05)",
                    boxShadow: `0 2px 8px rgba(0,0,0,0.2), 0 0 8px ${themeColors[theme].powered}`,
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  Level: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </motion.div>


                {/* Undo/Redo buttons */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={undoMove}
                  disabled={historyIndex <= 0}
                  className={`p-3 rounded-xl touch-target ${
                    historyIndex > 0 ? themeColors[theme].accent : "bg-gray-700/80 opacity-50"
                  } transition-colors btn-3d standard-radius`}
                  style={
                    historyIndex > 0
                      ? ({
                          boxShadow: `0 4px 0 0 rgba(0,0,0,0.3), 0 0 5px ${themeColors[theme].powered}30`,
                          "--glow-color": themeColors[theme].powered,
                        } as React.CSSProperties)
                      : { boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" }
                  }
                  aria-label="Undo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={redoMove}
                  disabled={historyIndex >= history.length - 1}
                  className={`p-3 rounded-xl touch-target ${
                    historyIndex < history.length - 1 ? themeColors[theme].accent : "bg-gray-700/80 opacity-50"
                  } transition-colors btn-3d standard-radius`}
                  style={
                    historyIndex < history.length - 1
                      ? ({
                          boxShadow: `0 4px 0 0 rgba(0,0,0,0.3), 0 0 5px ${themeColors[theme].powered}30`,
                          "--glow-color": themeColors[theme].powered,
                        } as React.CSSProperties)
                      : { boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" }
                  }
                  aria-label="Redo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>
              </div>
            </motion.div>


            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`grid grid-cols-3 gap-4 ${themeColors[theme].secondary} glass-effect p-6 rounded-xl shadow-xl border-2 ${isWin ? themeColors[theme].highlight + " animate-pulse" : "border-gray-600/30"} standard-radius`}
              style={{
                boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 15px ${themeColors[theme].powered}40`,
                ...(isWin && {
                  boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 25px ${themeColors[theme].powered}`,
                  "--glow-color": themeColors[theme].powered,
                }),
              }}
            >
              {tiles.map((tile) => (
  <motion.div
    key={tile.id}
    initial={{ opacity: 0, scale: 0.8, rotate: tile.rotation }}
    animate={{
      opacity: 1,
      scale: 1,
      rotate: tile.rotation,
      boxShadow: tile.isPowered
        ? `0 4px 12px rgba(0,0,0,0.3), 0 0 10px ${themeColors[theme].powered}60`
        : "0 4px 12px rgba(0,0,0,0.2)",
    }}
    transition={{
      duration: 0.3,
      delay: tile.id * 0.05,
      rotate: { type: "spring", stiffness: 100, damping: 10 },
    }}
    onClick={() => rotateTile(tile.id)}
    className={`relative aspect-square w-full max-w-[100px] sm:max-w-[120px] ${themeColors[theme].tileBg} rounded-xl cursor-pointer tile-shadow touch-target standard-radius
      ${!tile.isFixed && !isWin ? themeColors[theme].tileHover + " hover:shadow-lg" : ""}
      ${tile.isFixed ? "cursor-not-allowed" : ""}
      ${tile.isPowered ? "bg-opacity-90" : "bg-opacity-70"}
      transition-all duration-200`}
    whileHover={
      !tile.isFixed && !isWin
        ? {
            scale: 1.05,
            boxShadow: `0 8px 20px rgba(0,0,0,0.3), 0 0 15px ${themeColors[theme].powered}40`,
          }
        : {}
    }
    whileTap={!tile.isFixed && !isWin ? { scale: 0.95 } : {}}
  >
    <svg className="w-full h-full" viewBox="0 0 100 100">
      {getTilePath(tile.type, 0, tile.isPowered)}
      <path
        d="M0,0 L100,0 L100,100 L0,100 Z"
        fill="none"
        stroke="#4B5563"
        strokeWidth="1"
        strokeDasharray="4 4"
        strokeOpacity="0.3"
      />
    </svg>


    {tile.isFixed && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3 h-3 rounded-full bg-red-500 opacity-70"></div>
      </div>
    )}


    {tile.isPowered && (
      <div
        className="absolute inset-0 rounded-xl opacity-20 pointer-events-none glow-effect"
        style={{
          background: `radial-gradient(circle, ${themeColors[theme].powered} 0%, transparent 70%)`,
          animation: "pulse 2s infinite",
          "--glow-color": themeColors[theme].powered,
        } as React.CSSProperties}
      ></div>
    )}
  </motion.div>
))}


            </motion.div>


            <AnimatePresence>
              {isWin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className={`mt-8 ${themeColors[theme].win} px-8 py-6 rounded-xl shadow-lg text-center max-w-sm glass-effect standard-radius`}
                  style={
                    {
                      boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 20px ${themeColors[theme].powered}`,
                      "--glow-color": themeColors[theme].powered,
                    } as React.CSSProperties
                  }
                >
                  <motion.h2
                    className="text-2xl font-bold text-white mb-4 text-shadow glow-effect"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                  >
                    🎉 Circuit Complete! 🎉
                  </motion.h2>
                  <p className="text-white/90 text-lg high-contrast mb-6">Completed in {moveCount} moves</p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(255,255,255,0.5)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={initializeGame}
                      className="px-6 py-3 bg-white text-gray-800 rounded-xl font-bold hover:bg-gray-100 transition btn-3d touch-target high-contrast standard-radius"
                      style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" }}
                    >
                      Play Again
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const nextDifficulty =
                          difficulty === "easy" ? "medium" : difficulty === "medium" ? "hard" : "easy"
                        setDifficulty(nextDifficulty)
                        setTimeout(initializeGame, 100)
                      }}
                      className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition btn-3d touch-target high-contrast standard-radius"
                      style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.3)" }}
                    >
                      Next Level
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}


        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-auto pt-6 text-gray-200 text-base text-center high-contrast"
        >
          <p>Rotate tiles to connect all wires from the central source to the endpoints.</p>
        </motion.div>
      </div>
    </div>
  )
}






