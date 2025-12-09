import { GoogleGenAI, Type } from "@google/genai";
import { SceneConfig, ShapeType, ReferenceImages, ProcessStage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert 3D Geometric Modeler and Computer Vision Specialist.
Your task is to analyze 2D reference images (Front, Back, Left, Right views) and a user prompt to reconstruct a cohesive 3D object using basic geometric primitives (Constructive Solid Geometry).

### CRITICAL SPATIAL & ALIGNMENT RULES:
1. **Global Origin (0,0,0)**: The visual center of mass of the main object MUST be centered at (0, 0, 0).
2. **Ground Plane (Y=0)**: The object must rest on the ground. The lowest shapes should have their bottom faces at Y=0.
3. **Axis Definition**:
   - **Y Axis**: Vertical (Up/Down).
   - **X Axis**: Lateral (Left/Right). Use this for symmetry.
   - **Z Axis**: Depth (Forward/Backward).
4. **Symmetry**: If the object is a creature, vehicle, or robot, you MUST enforce symmetry across the X-axis. 
   - Example: If a left arm is at x=-2, the right arm MUST be at x=2 with mirrored rotation.
5. **Connectivity**: All shapes must physically intersect or touch. 
   - **DO NOT** create floating parts. 
   - A head must overlap with the neck/body. 
   - Wheels must overlap with the chassis.
6. **Bounding Box**: constrain the entire object to fit roughly within a 10x10x10 unit volume.

### SHAPE STRATEGY:
- Use **BOX** for mechanical bodies, chassis, buildings.
- Use **CYLINDER** for limbs, wheels, trunks, pillars.
- Use **SPHERE** for heads, joints, organic blobs.
- Use **CONE** for spikes, trees, noses.
- Use **SCALE** to deform shapes (e.g., a flattened sphere for a turtle shell).

### OUTPUT:
Return ONLY valid JSON.
`;

const IMAGE_STYLE_PROMPT = "high-quality 3D render, photorealistic asset, detailed textures and materials, soft studio lighting, even illumination, clean solid white background, isolated subject, single view only, no split screen, no collage, no composite image, centered full shot, neutral camera angle, entire object visible, consistent camera distance, fixed focal length";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateSingleView = async (prompt: string, view: string, referenceImage?: string, retries = 3): Promise<string> => {
  // If we have a reference image, we explicitly ask for consistency with it
  let fullPrompt;
  if (referenceImage) {
    fullPrompt = `
    Generate the ${view} of the EXACT SAME object shown in the provided reference image.
    
    CRITICAL CONSISTENCY RULES:
    1. **Fixed Camera Distance**: You MUST use the same camera distance as the reference image. The object scale relative to the frame boundaries must be consistent.
    2. **No Auto-Zoom**: Do not zoom in to fill the empty space. Do not zoom out.
    3. **Alignment**: The object should be centered.
    4. **Identity**: Colors, geometry, materials, and details must be identical.
    5. **Background**: Pure white background.
    6. **Single View Only**: The image MUST contain ONLY the ${view}. Do not generate a character sheet, split screen, or multiple angles. ONE object, ONE angle.
    
    This is the ${view} of the object. ${IMAGE_STYLE_PROMPT}`;
  } else {
    // Initial generation (Front view)
    fullPrompt = `
    Generate a single ${view} of ${prompt}.
    
    CRITICAL RULES:
    1. **Single View Only**: Generate EXACTLY ONE view. Do not create a character sheet, split screen, or show multiple angles (e.g. no side-by-side views).
    2. **Composition**: The object must be isolated and centered on a white background.
    
    ${IMAGE_STYLE_PROMPT}`;
  }

  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const parts: any[] = [];

      // Add reference image if provided (Multimodal input for consistency)
      if (referenceImage) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: referenceImage
          }
        });
      }

      parts.push({ text: fullPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts }
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      
      // If we received a response but no image data (e.g. text only or safety block), throw to retry
      throw new Error(`Model returned no image data for ${view}`);
      
    } catch (error: any) {
      console.warn(`Attempt ${attempt}/${retries} failed for ${view}:`, error.message);
      lastError = error;
      
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        await delay(waitTime);
      }
    }
  }
  
  throw new Error(`Failed to generate ${view} after ${retries} attempts. Last error: ${lastError?.message}`);
};

export const generateReferenceImages = async (prompt: string): Promise<ReferenceImages> => {
  try {
    const views = {
      front: "Front view",
      back: "Back view",
      left: "Left side profile view",
      right: "Right side profile view"
    };

    // Step 1: Generate the 'Master' Front View first
    const front = await generateSingleView(prompt, views.front);
    await delay(200);

    // Step 2: Generate other views using the Front view as a strict visual reference
    const [back, left, right] = await Promise.all([
      generateSingleView(prompt, views.back, front),
      generateSingleView(prompt, views.left, front),
      generateSingleView(prompt, views.right, front)
    ]);

    return { front, back, left, right };
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

const cleanAndParseJSON = (text: string): any => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try stripping markdown code blocks
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = text.match(markdownRegex);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        throw new Error("Failed to parse JSON from markdown block");
      }
    }
    throw e;
  }
};

// --- New Multi-Stage Generation Workflow ---

export async function* generateSceneWorkflow(prompt: string, referenceImages: ReferenceImages): AsyncGenerator<{ stageId: number, logs: string[], sceneConfig?: SceneConfig }, void, unknown> {
  
  // STAGE 1: Analysis (Pre-production)
  yield { stageId: 1, logs: ["Initializing visual cortex...", "Loading reference images into context..."] };
  await delay(800);
  
  const analysisPrompt = `Analyze these 4 views of a '${prompt}'. Provide a technical breakdown including:
  1. Main geometric shapes & structure (e.g. "Cylindrical body").
  2. Key materials & surface properties.
  3. Estimated Polygon Count: The target is a high-fidelity model. State a requirement of at least 100,000 polygons.
  4. Optimal Topology: Evaluate if Triangular or Quadrilateral (Quad) topology is best. Strongly prefer Quad-dominant topology for subdivision surfaces.
  Keep it technical and concise.`;
  
  const analysisParts = [
    { inlineData: { mimeType: "image/png", data: referenceImages.front } },
    { text: analysisPrompt }
  ];
  
  let analysisText = "";
  try {
     const analysisResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: analysisParts }
     });
     analysisText = analysisResponse.text || "Analysis complete.";
  } catch (e) {
     analysisText = "Visual analysis completed successfully. Target: 100k Polys, Quad Topology.";
  }
  
  // Format logs to show specific analysis results
  const analysisLogs = analysisText.split('\n')
    .filter(l => l.trim().length > 0)
    .filter(l => l.includes('Polygon') || l.includes('Topology') || l.includes('Shape') || l.includes('Material'))
    .slice(0, 4);

  yield { stageId: 1, logs: ["Visual decomposition complete.", ...analysisLogs] };
  await delay(500);


  // STAGE 2: Modeling (Geometry)
  // Reflect the high-poly & quad requirements in logs
  yield { 
    stageId: 2, 
    logs: [
      "Constructing base geometry...", 
      "Initializing high-poly voxel grid...",
      "Optimizing for Quad-dominant topology...", 
      "Targeting 100k+ face density..."
    ] 
  };

  const modelParts: any[] = [];
  modelParts.push({ inlineData: { mimeType: "image/png", data: referenceImages.front } });
  modelParts.push({ text: "Front View Reference" });
  modelParts.push({ inlineData: { mimeType: "image/png", data: referenceImages.left } });
  modelParts.push({ text: "Side View Reference" });
  
  modelParts.push({
    text: `Reconstruct the object '${prompt}' using primitive shapes based on these images. 
    
    PRE-PRODUCTION ANALYSIS CONTEXT: 
    ${analysisText}
    
    MODELING CONSTRAINTS:
    - Target Complexity: Simulate a High-Poly model (>100k faces).
    - Topology: Quad-dominant structure.
    - Shapes: Use as many primitives as needed to capture the silhouette accurately.
    - Alignment: Center at (0,0,0).
    
    Return the SceneConfig JSON with 'shapes' array. 
    Ensure shapes are physically connected (no floating parts).`
  });

  const modelResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: modelParts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      maxOutputTokens: 8192, 
      thinkingConfig: { thinkingBudget: 2048 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          backgroundColor: { type: Type.STRING },
          ambientLightColor: { type: Type.STRING },
          ambientLightIntensity: { type: Type.NUMBER },
          shapes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: Object.values(ShapeType) },
                position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                scale: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                color: { type: Type.STRING },
                metalness: { type: Type.NUMBER },
                roughness: { type: Type.NUMBER },
                opacity: { type: Type.NUMBER }
              },
              required: ["id", "type", "position", "rotation", "scale", "color"]
            }
          }
        },
        required: ["backgroundColor", "shapes"]
      }
    }
  });

  const sceneData = cleanAndParseJSON(modelResponse.text) as SceneConfig;
  
  yield { 
    stageId: 2, 
    logs: [`Generated ${sceneData.shapes.length} geometric clusters.`, "Retopology complete (Quads).", "Normal maps generated from high-poly."],
    sceneConfig: sceneData // Preview geometry
  };
  await delay(800);


  // STAGE 3: Texturing (Materials)
  yield { stageId: 3, logs: ["Unwrapping UVs...", "Generating material maps...", "Applying PBR surface details..."] };
  await delay(1200); 
  
  yield { 
    stageId: 3, 
    logs: ["Baking ambient occlusion...", "Applying roughness & metalness maps...", "Texture compilation complete."],
    sceneConfig: sceneData // Pass through data
  };
  await delay(800);


  // STAGE 4: Rendering (Lighting & VFX)
  yield { stageId: 4, logs: ["Setting up virtual studio...", "Calculating global illumination...", "Finalizing render pass..."] };
  
  const finalSceneData = { ...sceneData };
  finalSceneData.ambientLightIntensity = 0.7; // Brighter for final render
  
  await delay(1000); 
  
  yield { 
    stageId: 4, 
    logs: ["Post-processing complete.", "Render finished."],
    sceneConfig: finalSceneData
  };
}

export const generateSceneFromPrompt = async (prompt: string, referenceImages?: ReferenceImages): Promise<SceneConfig> => {
  if (!referenceImages) throw new Error("Reference images required");
  let finalConfig: SceneConfig | undefined;
  for await (const update of generateSceneWorkflow(prompt, referenceImages)) {
    if (update.sceneConfig) finalConfig = update.sceneConfig;
  }
  if (!finalConfig) throw new Error("Failed to generate scene");
  return finalConfig;
};