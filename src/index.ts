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
BufferGeometry,
MeshStandardMaterial2,
BloomPlugin, 
TemporalAAPlugin, 
RandomizedDirectionalLightPlugin, 
AssetImporter, 
Color, 
Mesh
} from "webgi"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import "./styles.scss"

gsap.registerPlugin(ScrollTrigger)

const diamondsObjectNames = [
    'diamonds003',
    'diamonds002',
    'diamonds001',
    'diamonds005002',
    'diamonds005',
    'diamonds005001',
]

let usingCustomColors = false

async function setupViewer(){

    const canvas = document.getElementById('webgi-canvas') as HTMLCanvasElement
    const viewer = new ViewerApp({
        canvas,
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
    const camView1 =  document.querySelector('.cam-view-1') as HTMLElement
    const camView3 =  document.querySelector('.cam-view-3') as HTMLElement
    const gemMenu =  document.querySelector('.gem--menu') as HTMLElement
    const footerMenu =  document.querySelector('.footer--menu') as HTMLElement
    const materialsMenu = document.querySelector('.materials--menu') as HTMLElement
    const configMaterial = document.querySelector('.config--material') as HTMLElement
    const configGem = document.querySelector('.config--gem') as HTMLElement
    let nightMode = false

    // Add WEBGi plugins
    await viewer.addPlugin(GBufferPlugin)
    await viewer.addPlugin(new ProgressivePlugin(32))
    await viewer.addPlugin(new TonemapPlugin(true, true,
        [
          `// This part is added before the main function in tonemap pass.
            vec4 vignette(vec4 color, vec2 uv, float offset, float darkness){
                uv = ( uv - vec2( 0.5 ) ) * vec2( offset );
                return vec4( mix( color.rgb, vec3( 0.17, 0.00, 0.09 ), dot( uv, uv ) ), color.a );
            }`,
            // This part is added inside main function after tonemapping before encoding conversion.
            `gl_FragColor = vignette(gl_FragColor, vUv, 1.2, 1.0);`
        ])
     )
    const ssr = await viewer.addPlugin(SSRPlugin)
    const ssao = await viewer.addPlugin(SSAOPlugin)
    await viewer.addPlugin(FrameFadePlugin)
    await viewer.addPlugin(GroundPlugin)
    const bloom = await viewer.addPlugin(BloomPlugin)
    await viewer.addPlugin(TemporalAAPlugin,)
    await viewer.addPlugin(DiamondPlugin)
    const dof = await viewer.addPlugin(DepthOfFieldPlugin)
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

    const ring = viewer.scene.findObjectsByName('Scene_1_1')[0] as any as Mesh<BufferGeometry,MeshStandardMaterial2>
    const silver = viewer.scene.findObjectsByName('silver')[0] as any as Mesh<BufferGeometry,MeshStandardMaterial2>
    const gold = viewer.scene.findObjectsByName('gold')[0] as any as Mesh<BufferGeometry,MeshStandardMaterial2>

    const diamondObjects: any[] = []
    for (const obj of diamondsObjectNames) {
        const o = viewer.scene.findObjectsByName(obj)[0]
        diamondObjects.push(o)
    }

    if(camera.controls) camera.controls!.enabled = false

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
        .fromTo(position, {x: isMobile ? 3 : 3, y: isMobile ? -0.8 : -0.8, z: isMobile ? 1.2 : 1.2}, {x: isMobile ? 1.28 : 1.28, y: isMobile ? -1.7 : -1.7, z: isMobile ? 5.86 : 5.86, duration: 4, onUpdate}, '-=0.8')
        .fromTo(target, {x: isMobile ? 2.5 : 2.5, y: isMobile ? -0.07 : -0.07, z: isMobile ? -0.1 : -0.1}, {x: isMobile ? -0.21 : 0.91, y: isMobile ? 0.03 : 0.03, z: isMobile ? -0.25 : -0.25, duration: 4, onUpdate}, '-=4')
        //.fromTo(position, {x: 3.6, y: -0.04, z: -3.93}, {x: -3.6, y: -0.04, z: -3.93, duration: 4, onUpdate}, '-=0.8')
        //.fromTo(target, {x: 3.16, y: -0.13, z: 0.51}, {x: isMobile ? -0.1 : 0.86, y: -0.13, z: 0.51, duration: 4, onUpdate}, '-=4')
        .fromTo('.header--container', {opacity: 0, y: '-100%'}, {opacity: 1, y: '0%', ease: "power1.inOut", duration: 0.8}, '-=1')
        .fromTo('.hero--scroller', {opacity: 0, y: '150%'}, {opacity: 1, y: '0%', ease: "power4.inOut", duration: 1}, '-=1')
        .fromTo('.hero--content', {opacity: 0, x: '100%'}, {opacity: 1, x: '0%', ease: "power4.inOut", duration: 1.8, onComplete: setupScrollAnimation}, '-=1')
    }

    function setupScrollAnimation(){
        document.body.style.overflowY = "scroll"
        document.body.removeChild(loaderElement)

        // customScrollingEnabled = true

        const tl = gsap.timeline({ default: {ease: 'none'}})

        // FOREVER
        tl.to(position, {x: -1.83, y: -0.14, z: 6.15,
            scrollTrigger: { trigger: ".cam-view-2",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }, onUpdate
        })

        .to(target,{x:-0.78, y: -0.03, z: -0.12,
            scrollTrigger: { trigger: ".cam-view-2",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
        })
        .to(ring.rotation,{z: -0.9,
            scrollTrigger: { trigger: ".cam-view-2",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
        })
        .fromTo(colorLerpValue, {x:0}, {x:1,
            scrollTrigger: { trigger: ".cam-view-2",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
            , onUpdate: function() {
                if(!usingCustomColors){
                    silver.material.color.lerpColors(new Color(0xfefefe).convertSRGBToLinear(), new Color(0xd28b8b).convertSRGBToLinear(), colorLerpValue.x)
                    gold.material.color.lerpColors(new Color(0xe2bf7f).convertSRGBToLinear(), new Color(0xd28b8b).convertSRGBToLinear(), colorLerpValue.x)
                    for (const o of diamondObjects) {
                        o.material.color.lerpColors(new Color(0xe7e7e7).convertSRGBToLinear(), new Color(0x39cffe).convertSRGBToLinear(), colorLerpValue.x)
                    }
                }
        }})
        .to('.hero--scroller', {opacity: 0, y: '150%',
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: "top center", scrub: 1, immediateRender: false, pin: '.hero--scroller--container'
        }})

        .to('.hero--content', {opacity: 0, xPercent: '100', ease: "power4.out",
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: "top top", scrub: 1, immediateRender: false, pin: '.hero--content',
        }})

        .to('.forever--text-bg', {opacity: 0.1, ease: "power4.inOut",
            scrollTrigger: { trigger: ".cam-view-2", start: "top bottom", end: 'top top', scrub: 1, immediateRender: false,
        }})

        .fromTo('.forever--content', {opacity: 0, x: '-110%'}, {opacity: 1, x: isMobile ? '0' : '20%', ease: "power4.inOut",
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
        .to(ring.rotation,{x: Math.PI *2, y:0, z: 0,
            scrollTrigger: { trigger: ".cam-view-3",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
        })
        .fromTo(colorLerpValue2, {x:0}, {x:1,
            scrollTrigger: { trigger: ".cam-view-3",  start: "top bottom", end: "top top", scrub: true, immediateRender: false }
            , onUpdate: function() {
                if(!usingCustomColors){
                    silver.material.color.lerpColors(new Color(0xd28b8b).convertSRGBToLinear(), new Color(0xf7c478).convertSRGBToLinear(), colorLerpValue2.x)
                    gold.material.color.lerpColors(new Color(0xd28b8b).convertSRGBToLinear(), new Color(0xf7c478).convertSRGBToLinear(), colorLerpValue2.x)
                    for (const o of diamondObjects) {
                        o.material.color.lerpColors(new Color(0x39cffe).convertSRGBToLinear(), new Color(0xf70db1).convertSRGBToLinear(), colorLerpValue2.x)
                    }
                }
        }})
        .to('.emotions--text-bg', {opacity: 0.1, ease: "power4.inOut",
            scrollTrigger: { trigger: ".cam-view-3", start: "top bottom", end: 'top top', scrub: 1, immediateRender: false,
        }})
        .fromTo('.emotions--content', {opacity: 0, y: '130%'}, {opacity: 1, y: '0%', duration: 0.5, ease: "power4.out",
            scrollTrigger: { trigger: ".cam-view-3", start: "top 20%", end: "top top", scrub: 1, immediateRender: false
        }})
        .to('.forever--content', {opacity: 0, ease: "power4.inOut",
            scrollTrigger: { trigger: ".cam-view-3", start: "top bottom", end: 'top center', scrub: 1, immediateRender: false
        }})
        .addLabel("Emotions")

    }

    let needsUpdate = true;
    function onUpdate(){
        needsUpdate = true;
    }

    // if(!isMobile){
    //     const sections = document.querySelectorAll('.section')
    //     const sectionTops: number[] = []
    //     sections.forEach(section=> {
    //         sectionTops.push(section.getBoundingClientRect().top)
    //     })
    //     setupCustomWheelSmoothScrolling(viewer, document.documentElement, sectionTops, )
    // }
    // else {
    //     createStyles(`
    //         .section-wrapper {
    //         scroll-snap-type: y mandatory;
    //         }

    //     `)
    // }

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
        exploreView.style.pointerEvents = "none"
        canvasView.style.pointerEvents = "all"
        canvasContainer.style.zIndex = "1"
        document.body.style.overflowY = "hidden"
        document.body.style.cursor = "grab"
        configAnimation()
        // customScrollingEnabled = false
    })

    function configAnimation(){
        const tlExplore = gsap.timeline()

        tlExplore.to(position,{x: -0.17, y: -0.25, z: 8.5, duration: 2.5, onUpdate})
        .to(target, {x: 0.05, y: -0.07, z: 0.07, duration: 2.5, onUpdate}, '-=2.5')
        .to(ring.rotation,{x: -Math.PI /2, y:0, z: 0, duration: 2.5}, '-=2.5')
        .to('.emotions--content', {opacity: 0, x: '130%', duration: 1.5, ease: "power4.out", onComplete: onCompleteConfigAnimation}, '-=2.5')
        .fromTo('.footer--menu',{opacity: 0, y:'150%'}, {opacity: 1, y: '0%', duration: 1.5})

    }

    let colorLerpValue = {x: 0}
    let colorLerpValue2 = {x: 0}

    function onCompleteConfigAnimation(){
        exitContainer.style.display = "flex"
        if(camera.controls){
            camera.controls.enabled = true
            camera.controls.autoRotate = true
        }
        dof.pass!.passObject.enabled = false

    }


    document.querySelector('.button--exit')?.addEventListener('click', () => {
        exploreView.style.pointerEvents = "all"
        canvasView.style.pointerEvents = "none"
        canvasContainer.style.zIndex = "unset"
        document.body.style.overflowY = "auto"
        exitContainer.style.display = "none"
        exitConfigAnimation()

        // customScrollingEnabled = true;
    })

    // EXIT EVENT
    function exitConfigAnimation(){

        if(camera.controls){
            camera.controls.enabled = true
            camera.controls.autoRotate = false
        }
        dof.pass!.passObject.enabled = true

        gemMenu.classList.remove('show')
        materialsMenu.classList.remove('show')
        if (document.querySelector('.footer--menu li.active')){
            document.querySelector('.footer--menu li.active')?.classList.remove('active')
        }

        const tlExit = gsap.timeline()

        tlExit.to(position,{x: -0.06, y: -1.15, z: 4.42, duration: 1.2, ease: "power4.out", onUpdate})
        .to(target, {x: -0.01, y: 0.9, z: 0.07, duration: 1.2, ease: "power4.out", onUpdate}, '-=1.2')
        .to(ring.rotation,{x:0, y:0, z: 0}, '-=1.2')
        .to('.footer--menu',{opacity: 0, y:'150%'}, '-=1.2')
        .to('.emotions--content', {opacity: 1, x: '0%', duration: 0.5, ease: "power4.out"}, '-=1.2')

    }

    // NIGHT MODE
    document.querySelector('.night--mode')?.addEventListener('click', () => {
        if(!nightMode){
            header.classList.add('night--mode--filter')
            camView1.classList.add('night--mode--filter')
            camView3.classList.add('night--mode--filter')
            camView3.classList.add('night--mode--filter')
            footerMenu.classList.add('night--mode--filter')
            viewer.setBackground(new Color(0x22052f).convertSRGBToLinear())
            nightMode = true
        } else{
            header.classList.remove('night--mode--filter')
            camView1.classList.remove('night--mode--filter')
            camView3.classList.remove('night--mode--filter')
            footerMenu.classList.remove('night--mode--filter')
            viewer.setBackground(new Color(0xE4B9B8).convertSRGBToLinear())
            nightMode = false
        }
    })

    // GEM MENU
    configGem.addEventListener('click', () => {
        gemMenu.classList.add('show')
        materialsMenu.classList.remove('show')
        
        if (document.querySelector('.footer--menu li.active')){
            document.querySelector('.footer--menu li.active')?.classList.remove('active')
        }
        configGem.parentElement?.classList.add('active')
    })

    // DIAMOND COLORS
    document.querySelector('.ruby')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#f70db1'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.ruby')?.classList.add('active')
    })
    document.querySelector('.faint')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#CFECEC'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.faint')?.classList.add('active')
     })
     document.querySelector('.fancy')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#a9cbe2'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.fancy')?.classList.add('active')
     })
     
     document.querySelector('.aqua')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#62cffe'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.aqua')?.classList.add('active')
     })
     document.querySelector('.swiss')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#76dce4'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.swiss')?.classList.add('active')
     })
     document.querySelector('.yellow')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#efe75b'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.yellow')?.classList.add('active')
     })
     document.querySelector('.orange')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#eb8e17'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.orange')?.classList.add('active')
     })
     document.querySelector('.green')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#17ebb5'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.green')?.classList.add('active')
     })
     document.querySelector('.emerald')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#5eca00'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.emerald')?.classList.add('active')
     })
     document.querySelector('.rose')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#fa37d7'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.rose')?.classList.add('active')
     })
     document.querySelector('.violet')?.addEventListener('click', () => {
        changeDiamondColor(new Color('#c200f2'))
        document.querySelector('.colors--list li.active')?.classList.remove('active')
        document.querySelector('.violet')?.classList.add('active')
     })

    // CHANGE DIAMOND COLOR
    function changeDiamondColor(_gemColor: Color){
        for (const o of diamondObjects) {
            o.material.color = _gemColor
        }
        usingCustomColors = true
    }


    // MATERIALS MENU
    configMaterial.addEventListener('click', () => {
        materialsMenu.classList.add('show')
        gemMenu.classList.remove('show')
        
        if (document.querySelector('.footer--menu li.active')){
            document.querySelector('.footer--menu li.active')?.classList.remove('active')
        }
        configMaterial.parentElement?.classList.add('active')
    })

    // MATERIALS COLOR
    document.querySelector('.default')?.addEventListener('click', () => {
        changeMaterialColor(new Color(0xfea04d),new Color(0xffffff))
        document.querySelector('.materials--list li.active')?.classList.remove('active')
        document.querySelector('.default')?.classList.add('active')
     })
    document.querySelector('.silver-gold')?.addEventListener('click', () => {
        changeMaterialColor(new Color(0xffffff), new Color(0xfea04d))
        document.querySelector('.materials--list li.active')?.classList.remove('active')
        document.querySelector('.silver-gold')?.classList.add('active')
     })
     
    document.querySelector('.silver-silver')?.addEventListener('click', () => {
        changeMaterialColor(new Color(0xffffff), new Color(0xffffff))
        document.querySelector('.materials--list li.active')?.classList.remove('active')
        document.querySelector('.silver-silver')?.classList.add('active')
     })
    
    document.querySelector('.gold-gold')?.addEventListener('click', () => {
        changeMaterialColor(new Color(0xfea04d), new Color(0xfea04d))
        document.querySelector('.materials--list li.active')?.classList.remove('active')
        document.querySelector('.gold-gold')?.classList.add('active')
     })
    document.querySelector('.rose-silver')?.addEventListener('click', () => {
        changeMaterialColor(new Color(0xfa8787), new Color(0xffffff))
        document.querySelector('.materials--list li.active')?.classList.remove('active')
        document.querySelector('.rose-silver')?.classList.add('active')
    })
    document.querySelector('.gold-rose')?.addEventListener('click', () => {
        changeMaterialColor(new Color(0xfea04d), new Color(0xfa8787))
        document.querySelector('.materials--list li.active')?.classList.remove('active')
        document.querySelector('.gold-rose')?.classList.add('active')
    })
    document.querySelector('.rose-rose')?.addEventListener('click', () => {
        changeMaterialColor(new Color(0xfa8787), new Color(0xfa8787))
        document.querySelector('.materials--list li.active')?.classList.remove('active')
        document.querySelector('.rose-rose')?.classList.add('active')
    })

    // CHANGE MATERIAL COLOR
    function changeMaterialColor(_firstColor: Color, _secondColoor: Color){
        silver.material.color = _firstColor
        gold.material.color = _secondColoor
        usingCustomColors = true
    }

}


// let customScrollingEnabled = false
// function setupCustomWheelSmoothScrolling(viewer: ViewerApp, element: HTMLElement, snapPositions: number[], speed = 1.5){
//     let customScrollY = element.scrollTop
//     let frameDelta = 0
//     let scrollVelocity = 0
//     let lastDeltaDirection = 0

//     window.addEventListener('wheel', (e: WheelEvent)=>{
//         if(!customScrollingEnabled) return;
//         e.preventDefault()
//         e.stopPropagation()
//         // todo: check delta mode?
//         frameDelta = Math.min(Math.max(e.deltaY * speed, -window.innerHeight / 3), window.innerHeight / 3);
//         lastDeltaDirection = Math.sign(frameDelta)
//         return false
//     }, {passive: false})


//     const idleSpeedFactor = 0.0
//     const snapSpeedFactor = 0.3
//     const snapProximity = window.innerHeight / 5
//     const wheelDamping = 0.25
//     const velocityDamping = 0.1

//     viewer.addEventListener('preFrame', ()=>{
//         if(!customScrollingEnabled) return;
//         if (Math.abs(frameDelta) < 1) {
//             const nearestSection = snapPositions.reduce((prev, curr) => Math.abs(curr - customScrollY) < Math.abs(prev - customScrollY) ? curr : prev)
//             let d = nearestSection - customScrollY
//             if(Math.sign(d) !== lastDeltaDirection) d *= -1
//             scrollVelocity = d * (Math.abs(d) < snapProximity ? snapSpeedFactor : idleSpeedFactor);
//         }
//         scrollVelocity += frameDelta * wheelDamping
//         frameDelta *= (1.-wheelDamping)
//         if (Math.abs(frameDelta) < 0.01) frameDelta = 0
//         if (Math.abs(scrollVelocity) > 0.01) {
//             customScrollY = Math.max(customScrollY + scrollVelocity * velocityDamping, 0)
//             element.scrollTop = customScrollY
//             scrollVelocity *= (1.-velocityDamping)
//         } else {
//             scrollVelocity = 0
//         }

//     })

// }

setupViewer()
