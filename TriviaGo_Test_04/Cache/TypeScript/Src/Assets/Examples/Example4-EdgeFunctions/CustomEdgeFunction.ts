import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton"
import {SnapCloudRequirements} from "../SnapCloudRequirements"

@component
export class EdgeFunctionImgProcessing extends BaseScriptComponent {
  // Internet Module - Use require instead of @input
  private internetModule: InternetModule = require("LensStudio:InternetModule")

  // Supabase Configuration - Centralized via SnapCloudRequirements
  @input
  @hint("Reference to SnapCloudRequirements for centralized Supabase configuration")
  public snapCloudRequirements: SnapCloudRequirements

  @input
  @hint("Edge Function name (will use SnapCloudRequirements to build full URL)")
  public functionName: string = "[your-function-name]" // set this to: random-trivia

  // Function Parameters (not used by random-trivia, but kept for compatibility)
  @input
  @hint("Image URL from your Supabase Storage to process")
  public imageUrl: string = "[Insert your Supabase storage URL]/storage/v1/object/public/[bucket-name]/[path-to-image]"

  @input
  @hint("Output image component to display processed result")
  public outputImage: Image

  // Button Configuration
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

  /**
   * Initialize the Edge Function service
   */
  private initializeService() {
    if (!this.snapCloudRequirements || !this.snapCloudRequirements.isConfigured()) {
      this.log("SnapCloudRequirements not configured")
      return
    }

    if (!this.functionName || this.functionName === "[your-function-name]") {
      this.log("Function name not configured (set it to: random-trivia)")
      return
    }

    const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`
    this.log("Edge Function service initialized")
    this.log(`Endpoint: ${endpointUrl}`)
  }

  /**
   * Setup process button interaction using Spectacles UI Kit
   */
  private setupProcessButton() {
    if (!this.processButton) {
      this.log("No process button assigned")
      this.log("You can also call callFunction() manually")
      return
    }

    this.log(`Process button assigned: ${this.processButton.name}`)

    // Add the event listener to the process button onTriggerUp
    this.processButton.onTriggerUp.add(() => {
      this.log("PROCESS BUTTON PRESSED!")
      this.callEdgeFunction()
    })

    this.log("Process button interaction setup complete")
  }

  /**
   * Call the Supabase Edge Function with image processing
   */
  private callEdgeFunction() {
    try {
      const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`
      this.log("Processing with Edge Function...")
      this.log(`Sending request to: ${endpointUrl}`)

      // random-trivia ignores imageUrl, but we keep payload as-is for compatibility
      this.downloadAndProcessImage()
    } catch (error) {
      this.log(`Error preparing image: ${error}`)
    }
  }

  /**
   * Send image URL to Edge Function for processing
   *
   * NOTE: For random-trivia, the response is:
   * { ok: true, record: { ...all Trivia columns... } | null, totalCount: number }
   */
  private async downloadAndProcessImage() {
    try {
      this.log(`Sending image URL to Edge Function (may be ignored): ${this.imageUrl}`)

      // Payload (random-trivia doesn't use it, but your Edge call pipeline expects a body)
      const payload = {
        imageUrl: this.imageUrl
      }

      const request = RemoteServiceHttpRequest.create()
      request.url = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`
      request.headers = this.snapCloudRequirements.getSupabaseHeaders()
      request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post
      request.body = JSON.stringify(payload)

      this.log("Sending request to Edge Function...")
      this.internetModule.performHttpRequest(request, (response) => {
        this.log(`Response Status: ${response.statusCode}`)

        if (response.statusCode === 200) {
          this.log("Edge Function responded successfully")

          try {
            const result = JSON.parse(response.body)

            // random-trivia uses { ok, record, totalCount }
            if (result.ok === true) {
              this.log("Edge Function returned random Trivia row ✅")

              if (result.record) {
                // Log full row (all columns)
                this.log(`Trivia Row (record): ${JSON.stringify(result.record)}`)

                // Optional convenience logs (only if fields exist)
                if (result.record.id !== undefined) this.log(`id: ${result.record.id}`)
                if (result.record.question !== undefined) this.log(`question: ${result.record.question}`)
              } else {
                this.log("Trivia is empty (record is null)")
              }

              if (result.totalCount !== undefined) {
                this.log(`totalCount: ${result.totalCount}`)
              }
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

  /**
   * Download and display the processed image from Supabase Storage
   *
   * Kept from your original script, but random-trivia doesn't return processedUrl.
   * You can safely delete this if you want.
   */
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

  /**
   * Apply processed texture to output image
   */
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

  /**
   * Handle error response
   */
  private onError(statusCode: number, errorBody: string) {
    this.log(`Edge Function call failed with status ${statusCode}`)
    this.log(`Error details: ${errorBody}`)
  }

  /**
   * Public method to call the function manually
   */
  public callFunction() {
    this.callEdgeFunction()
  }

  /**
   * Call function with different image URL
   */
  public callFunctionWithImageUrl(imageUrl: string) {
    this.imageUrl = imageUrl
    this.callEdgeFunction()
  }

  /**
   * Logging helper
   */
  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[CustomEdgeFunction] ${message}`)
    }
  }
}