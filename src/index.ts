import {
    ViewerApp,
    AssetManagerPlugin,
    timeout,
    SSRPlugin,
    mobileAndTabletCheck,
    GBufferPlugin,
    ProgressivePlugin,
    TonemapPlugin,
    SSAOPlugin,
    GroundPlugin,
    FrameFadePlugin,
    DiamondPlugin,
    DepthOfFieldPlugin,
    BloomPlugin, TemporalAAPlugin, RandomizedDirectionalLightPlugin, AssetImporter,
} from "webgi"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "./styles.scss"

gsap.registerPlugin(ScrollTrigger)

async function setupViewer(){

    const viewer = new ViewerApp({
        canvas: document.getElementById('webgi-canvas') as HTMLCanvasElement,
        useGBufferDepth: true,
        isAntialiased: false
    })

    const isMobile = mobileAndTabletCheck()

    viewer.renderer.displayCanvasScaling = Math.min(window.devicePixelRatio, 1)

    const manager = await viewer.addPlugin(AssetManagerPlugin)
    const camera = viewer.scene.activeCamera
    const position = camera.position
    const target = camera.target
    
    // Interface Elements
    const exploreView = document.querySelector('.cam-view-3') as HTMLElement
    const canvasView = document.getElementById('webgi-canvas') as HTMLElement
    const canvasContainer = document.getElementById('webgi-canvas-container') as HTMLElement
    const exitContainer = document.querySelector('.exit--container') as HTMLElement    
    const loaderElement = document.querySelector('.loader') as HTMLElement
    const header = document.querySelector('.header') as HTMLElement
    const bodyButton =  document.querySelector('.button--body') as HTMLElement

    // Add WEBGi plugins
    await viewer.addPlugin(GBufferPlugin)
    await viewer.addPlugin(new ProgressivePlugin(32))
    await viewer.addPlugin(new TonemapPlugin(true, true))
    const ssr = await viewer.addPlugin(SSRPlugin)
    const ssao = await viewer.addPlugin(SSAOPlugin)
    await viewer.addPlugin(FrameFadePlugin)
    await viewer.addPlugin(GroundPlugin)
    const bloom = await viewer.addPlugin(BloomPlugin)
    await viewer.addPlugin(TemporalAAPlugin)
    await viewer.addPlugin(DiamondPlugin)
    await viewer.addPlugin(DepthOfFieldPlugin)
    await viewer.addPlugin(RandomizedDirectionalLightPlugin, false)

    ssr!.passes.ssr.passObject.lowQualityFrames = 0
    bloom.pass!.passObject.bloomIterations = 2
    ssao.passes.ssao.passObject.material.defines.NUM_SAMPLES = 4

    // WEBGi loader
    const importer = manager.importer as AssetImporter

    importer.addEventListener("onStart", (ev) => {
        onUpdate()
    })

    importer.addEventListener("onProgress", (ev) => {
        const progressRatio = (ev.loaded / ev.total)
        document.querySelector('.progress')?.setAttribute('style',`transform: scaleX(${progressRatio})`)
    })

    importer.addEventListener("onLoad", (ev) => {
        introAnimation()
    })

    viewer.renderer.refreshPipeline()

    // WEBGi load model
    await manager.addFromPath("./assets/ring_webgi.glb")

    const ring = viewer.scene.findObjectsByName('Scene_1_1')[0]

    if(camera.controls) camera.controls.enabled = false

    // WEBGi mobile adjustments
    if(isMobile){
        ssr.passes.ssr.passObject.stepCount /= 2
        bloom.enabled = false
        camera.setCameraOptions({fov:65})
    }

    window.scrollTo(0,0)

    await timeout(50)

    function introAnimation(){
        const introTL = gsap.timeline()
        introTL
        .to('.loader', {x: '150%', duration: 0.8, ease: "power4.inOut", delay: 1})
        .fromTo(position, {x: 3, y: -0.8, z: 1.2}, {x: 1.28, y: -1.7, z: 5.86, duration: 4, onUpdate}, '-=0.8')
        .fromTo(target, {x: 2.5, y: -0.07, z: -0.1}, {x: 0.91, y: 0.03, z: -0.25, duration: 4, onUpdate}, '-=4')
        //.fromTo(position, {x: 3.6, y: -0.04, z: -3.93}, {x: -3.6, y: -0.04, z: -3.93, duration: 4, onUpdate}, '-=0.8')
        //.fromTo(target, {x: 3.16, y: -0.13, z: 0.51}, {x: isMobile ? -0.1 : 0.86, y: -0.13, z: 0.51, duration: 4, onUpdate}, '-=4')
        .fromTo('.header--container', {opacity: 0, y: '-100%'}, {opacity: 1, y: '0%', ease: "power1.inOut", duration: 0.8}, '-=1')
        .fromTo('.hero--scroller', {opacity: 0, y: '150%'}, {opacity: 1, y: '0%', ease: "power4.inOut", duration: 1}, '-=1')
        .fromTo('.hero--content', {opacity: 0, x: '100%'}, {opacity: 1, x: '0%', ease: "power4.inOut", duration: 1.8, onComplete: setupScrollAnimation}, '-=1')
    }

    function setupScrollAnimation(){
        document.body.setAttribute("style", "overflow-y: scroll")
        document.body.removeChild(loaderElement)


        const tl = gsap.timeline({ default: {ease: 'none'}})

        // PERFORMANCE SECTION
        tl.to(position, {x: -1.83, y: -0.14, z: 6.15,
            scrollTrigger: { trigger: ".cam-view-2",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }, onUpdate
        })

        .to(target,{x:-0.78, y: -0.03, z: -0.12,
            scrollTrigger: { trigger: ".cam-view-2",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
        })
        .to(ring.rotation,{z: -0.9,
            scrollTrigger: { trigger: ".cam-view-2",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
        })
        .to('.hero--scroller', {opacity: 0, y: '150%',
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: "top center", scrub: 1, immediateRender: false, pin: '.hero--scroller--container'
        }})

        .to('.hero--content', {opacity: 0, xPercent: '100', ease: "power4.out",
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: "top top", scrub: 1, immediateRender: false, pin: '.hero--content',
        }}).addLabel("start")

        .to('.forever--text-bg', {opacity: 0.1, ease: "power4.inOut",
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: 'top top', scrub: 1, immediateRender: false,
        }})

        .fromTo('.forever--content', {opacity: 0, x: '-110%'}, {opacity: 1, x: '20%', ease: "power4.inOut",
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: 'top top', scrub: 1, immediateRender: false, pin: '.forever--container',
        }})
        .addLabel("Forever")
        

        


        // // EMOTIONS SECTION
        .to(position,  {x: -0.06, y: -1.15, z: 4.42,
            scrollTrigger: { trigger: ".cam-view-3",  start: "top bottom", end: "top top", scrub: true, immediateRender: false,
        }, onUpdate
        })
        .to(target, {x: -0.01, y: 0.9, z: 0.07,
            scrollTrigger: { trigger: ".cam-view-3",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }, onUpdate
        })
        .to(ring.rotation,{x:0, y:0, z: 0,
            scrollTrigger: { trigger: ".cam-view-3",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
        })
        .to('.emotions--text-bg', {opacity: 0.1, ease: "power4.inOut",
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: 'top top', scrub: 1, immediateRender: false,
        }})
        .fromTo('.emotions--content', {opacity: 0, y: '130%'}, {opacity: 1, y: '0%', duration: 0.5, ease: "power4.out",
            scrollTrigger: { trigger: ".cam-view-3", start: "top 20%", end: "top top", scrub: 1, immediateRender: false
        }})
        .addLabel("Emotions")

    }

    let needsUpdate = true;
    function onUpdate(){
        needsUpdate = true;
    }

    viewer.addEventListener('preFrame', ()=>{
        if(needsUpdate){
            camera.positionUpdated(false)
            camera.targetUpdated(true)
            needsUpdate = false;
        }
    })

    // KNOW MORE EVENT
    document.querySelector('.button-scroll')?.addEventListener('click', () => {
        const element = document.querySelector('.cam-view-2')
        window.scrollTo({top: element?.getBoundingClientRect().top, left: 0, behavior: 'smooth'})
    })

    // EXPLORE ALL FEATURES EVENT
    document.querySelector('.btn-customize')?.addEventListener('click', () => {
        exploreView.setAttribute("style", "pointer-events: none")
        canvasView.setAttribute("style", "pointer-events: all")
        canvasContainer.setAttribute("style", "z-index: 1")
        header.setAttribute("style", "position: fixed")
        document.body.setAttribute("style", "overflow-y: hidden")
        document.body.setAttribute("style", "cursor: grab")
        configAnimation()
    })

    function configAnimation(){
        const tlExplore = gsap.timeline()

        tlExplore.to(position,{x: 5, y: 0.3, z: -4.5, duration: 2.5, onUpdate})
        .to(target, {x: -0.26, y: -0.2, z: 0.9, duration: 2.5, onUpdate}, '-=2.5')
        .fromTo('.header', {opacity: 0}, {opacity: 1, duration: 1.5, ease: "power4.out"}, '-=2.5')
        .to('.emotions--content', {opacity: 0, x: '130%', duration: 1.5, ease: "power4.out", onComplete: onCompleteExplore}, '-=2.5')
    }

    function onCompleteExplore(){
        exitContainer.setAttribute("style", "display: flex")
        if(camera.controls) camera.controls.enabled = true
    }

    document.querySelector('.button--exit')?.addEventListener('click', () => {
        exploreView.setAttribute("style", "pointer-events: all")
        canvasView.setAttribute("style", "pointer-events: none")
        canvasContainer.setAttribute("style", "z-index: unset")
        document.body.setAttribute("style", "overflow-y: auto")
        exitContainer.setAttribute("style", "display: none")
        header.setAttribute("style", "position: absolute")
        exitConfigAnimation()
    })

    // EXIT EVENT
    function exitConfigAnimation(){
        if(camera.controls) camera.controls.enabled = false

        const tlExit = gsap.timeline()

        tlExit.to(position,{x: -0.06, y: -1.15, z: 4.42, duration: 1.2, ease: "power4.out", onUpdate})
        .to(target, {x: -0.01, y: 0.9, z: 0.07, duration: 1.2, ease: "power4.out", onUpdate}, '-=1.2')
        .to('.emotions--content', {opacity: 1, x: '0%', duration: 0.5, ease: "power4.out"}, '-=1.2')
    }

}

setupViewer()
