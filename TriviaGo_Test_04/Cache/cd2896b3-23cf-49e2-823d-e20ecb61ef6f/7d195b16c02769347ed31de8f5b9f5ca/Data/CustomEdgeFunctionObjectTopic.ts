import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton"
import {SnapCloudRequirements} from "../SnapCloudRequirements"

@component
export class EdgeFunctionImgProcessing extends BaseScriptComponent {
  private internetModule: InternetModule = require("LensStudio:InternetModule")

  @input
  @hint("Reference to SnapCloudRequirements for centralized Supabase configuration")
  public snapCloudRequirements: SnapCloudRequirements

  @input
  @hint("Edge Function name (will use SnapCloudRequirements to build full URL)")
  public functionName: string = "[your-function-name]" // e.g. random-trivia

  // ✅ NEW: object filter
  @input
  @hint("Optional Trivia `object` filter. Leave empty to not filter.")
  public object: string = ""

  // ✅ NEW: topic filter
  @input
  @hint("Optional Trivia `topic` filter. Leave empty to not filter.")
  public topic: string = ""

  // Kept from your original script (not used by this Edge Function)
  @input
  @hint("Output image component to display processed result (not used by random-trivia)")
  public outputImage: Image

  @input
  @hint("RectangleButton to trigger Edge Function call (from Spectacles UI Kit)")
  public processButton: RectangleButton

  @input
  @hint("Enable debug logging")
  public enableDebugLogs: boolean = true

  onAwake() {
    this.log("CustomEdgeFunction initializing...")
    this.initializeService()
    this.setupProcessButton()
  }

  private initializeService() {
    if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
      this.log("SnapCloudRequirements not configured")
      return
    }

    if (!this.functionName || this.functionName === "[your-function-name]") {
      this.log("Function name not configured (set it to your Edge Function name)")
      return
    }

    const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`
    this.log("Edge Function service initialized")
    this.log(`Endpoint: ${endpointUrl}`)
  }

  private setupProcessButton() {
    if (!this.processButton) {
      this.log("No process button assigned")
      this.log("You can also call callFunction() manually")
      return
    }

    this.log(`Process button assigned: ${this.processButton.name}`)

    this.processButton.onTriggerUp.add(() => {
      this.log("PROCESS BUTTON PRESSED!")
      this.callEdgeFunction()
    })

    this.log("Process button interaction setup complete")
  }

  private callEdgeFunction() {
    try {
      const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`
      this.log("Calling Edge Function (random-trivia)...")
      this.log(`Sending request to: ${endpointUrl}`)

      this.callEdgeFunctionWithFilters()
    } catch (error) {
      this.log(`Error preparing request: ${error}`)
    }
  }

  private callEdgeFunctionWithFilters() {
    try {
      const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`

      const objectTrimmed = this.object ? this.object.trim() : ""
      const topicTrimmed = this.topic ? this.topic.trim() : ""

      this.log(`object filter: ${objectTrimmed ? objectTrimmed : "(none)"}`)
      this.log(`topic filter: ${topicTrimmed ? topicTrimmed : "(none)"}`)

      // Build payload: only include fields if not empty
      const payload: any = {}
      if (objectTrimmed.length > 0) payload.object = objectTrimmed
      if (topicTrimmed.length > 0) payload.topic = topicTrimmed

      const request = RemoteServiceHttpRequest.create()
      request.url = endpointUrl
      request.headers = this.snapCloudRequirements.getSupabaseHeaders()
      request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post
      request.body = JSON.stringify(payload)

      this.log("Sending request...")
      this.internetModule.performHttpRequest(request, (response) => {
        this.log(`Response Status: ${response.statusCode}`)

        if (response.statusCode === 200) {
          this.log("Edge Function responded successfully")

          try {
            const result = JSON.parse(response.body)

            if (result.ok === true) {
              this.log("Received random Trivia row ✅")

              if (result.object !== undefined) this.log(`object returned: ${result.object}`)
              if (result.topic !== undefined) this.log(`topic returned: ${result.topic}`)

              if (result.record) {
                this.log(`Trivia Row (record): ${JSON.stringify(result.record)}`)

                // Optional convenience logs (only if fields exist)
                if (result.record.id !== undefined) this.log(`id: ${result.record.id}`)
                if (result.record.question !== undefined) this.log(`question: ${result.record.question}`)
                if (result.record.answer !== undefined) this.log(`answer: ${result.record.answer}`)
              } else {
                this.log("Trivia is empty (record is null)")
              }

              if (result.totalCount !== undefined) this.log(`totalCount: ${result.totalCount}`)
            } else {
              this.log(`Unexpected response payload: ${response.body}`)
            }
          } catch (parseError) {
            this.log(`Error parsing response JSON: ${parseError}`)
            this.log(`Raw response: ${response.body}`)
          }
        } else {
          this.log(`Edge Function Error (${response.statusCode}): ${response.body}`)
        }
      })
    } catch (error) {
      this.log(`Error calling Edge Function: ${error}`)
    }
  }

  // Kept from your original script (not used by this edge function).
  private downloadAndDisplayProcessedImage(imageUrl: string) {
    try {
      this.log(`Downloading processed image from: ${imageUrl}`)

      const remoteMediaModule = require("LensStudio:RemoteMediaModule") as RemoteMediaModule
      const resource = (this.internetModule as any).makeResourceFromUrl(imageUrl)

      if (!resource) {
        this.log("Failed to create resource from URL")
        return
      }

      remoteMediaModule.loadResourceAsImageTexture(
        resource,
        (texture) => {
          this.log("Processed image downloaded successfully!")
          this.applyProcessedTexture(texture)
        },
        (error) => {
          this.log(`Failed to download processed image: ${error}`)
        }
      )
    } catch (error) {
      this.log(`Error downloading processed image: ${error}`)
    }
  }

  private applyProcessedTexture(texture: Texture) {
    try {
      if (this.outputImage) {
        this.outputImage.enabled = true
        this.outputImage.mainPass.baseTex = texture
        this.log("Processed image applied to output component")
      } else {
        this.log("No output image component assigned")
      }
    } catch (error) {
      this.log(`Error applying processed texture: ${error}`)
    }
  }

  private onError(statusCode: number, errorBody: string) {
    this.log(`Edge Function call failed with status ${statusCode}`)
    this.log(`Error details: ${errorBody}`)
  }

  public callFunction() {
    this.callEdgeFunction()
  }

  // Optional helper if you want to set both filters via code
  public callFunctionWithFilters(objectValue: string, topicValue: string) {
    this.object = objectValue
    this.topic = topicValue
    this.callEdgeFunction()
  }

  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[CustomEdgeFunction] ${message}`)
    }
  }
}