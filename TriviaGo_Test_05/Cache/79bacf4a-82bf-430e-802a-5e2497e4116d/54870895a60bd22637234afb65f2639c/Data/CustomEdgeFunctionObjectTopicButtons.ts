import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton"
import { SnapCloudRequirements } from "../SnapCloudRequirements"

@component
export class CustomEdgeFunctionObjectTopicUI extends BaseScriptComponent {
  private internetModule: InternetModule = require("LensStudio:InternetModule")

  // ===== Edge Function config =====
  @input
  @hint("Reference to SnapCloudRequirements for centralized Supabase configuration")
  public snapCloudRequirements: SnapCloudRequirements

  @input
  @hint("Edge Function name (e.g. random-trivia)")
  public functionName: string = "[your-function-name]"

  @input
  @hint("Optional Trivia `object` filter. Leave empty to not filter.")
  public object: string = ""

  @input
  @hint("Optional Trivia `topic` filter. Leave empty to not filter.")
  public topic: string = ""

  @input
  @hint("Enable debug logging")
  public enableDebugLogs: boolean = true

  // ===== Trigger =====
  @input
  @hint("Button used to request the next trivia question")
  public processButton: RectangleButton

  // ===== Outputs =====
  @input
  @hint("Text component that displays the question")
  public questionText: Text

  @input
  @hint("4 option buttons to display option1..option4 (each has a text sceneobject child)")
  public optionButton1: RectangleButton
  public optionButton2: RectangleButton
  public optionButton3: RectangleButton
  public optionButton4: RectangleButton

  // Optional: set if you know the exact child node name that holds the Text.
  @input
  @hint("Name of the child Text sceneobject inside each RectangleButton (optional). Leave empty to search for first Text component.")
  public optionButtonChildTextName: string = ""

  private optionTexts: (Text | null)[] = [null, null, null, null]

  onAwake() {
    this.log("CustomEdgeFunctionObjectTopicUI initializing...")

    this.initializeService()
    this.cacheOptionChildTextNodes()
    this.setupProcessButton()

    this.setQuestionText("")
    this.setOptionButtonsEnabled(false)
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
  }

  private setupProcessButton() {
    if (!this.processButton) {
      this.log("No processButton assigned")
      return
    }

    this.processButton.onTriggerUp.add(() => {
      this.log("PROCESS BUTTON PRESSED -> fetching trivia...")
      this.fetchTriviaAndUpdateUI()
    })
  }

  private cacheOptionChildTextNodes() {
    this.optionTexts[0] = this.findButtonChildText(this.optionButton1)
    this.optionTexts[1] = this.findButtonChildText(this.optionButton2)
    this.optionTexts[2] = this.findButtonChildText(this.optionButton3)
    this.optionTexts[3] = this.findButtonChildText(this.optionButton4)

    this.log("Cached option button child Text nodes.")
  }

  private findButtonChildText(btn: RectangleButton): Text | null {
    if (!btn) return null

    const rootObj: SceneObject = btn.getSceneObject()
    if (!rootObj) return null

    if (this.optionButtonChildTextName && this.optionButtonChildTextName.length > 0) {
      const namedObj = this.findChildByNameRecursive(rootObj, this.optionButtonChildTextName)
      if (namedObj) {
        const t = namedObj.getComponent("Text") as Text
        if (t) return t
      }
    }

    // fallback: first Text component found anywhere under the button
    return this.findFirstTextInDescendants(rootObj)
  }

  private findChildByNameRecursive(root: SceneObject, name: string): SceneObject | null {
    // Check root itself
    if ((root as any).name === name) {
      return root
    }

    const count = root.getChildCount()
    for (let i = 0; i < count; i++) {
      const child = root.getChild(i)
      if (!child) continue

      if ((child as any).name === name) {
        return child
      }

      const deeper = this.findChildByNameRecursive(child, name)
      if (deeper) return deeper
    }
    return null
  }

  private findFirstTextInDescendants(root: SceneObject): Text | null {
    // Try root first (in case the Text is directly on root)
    const rootText = root.getComponent("Text") as Text
    if (rootText) return rootText

    const count = root.getChildCount()
    for (let i = 0; i < count; i++) {
      const child = root.getChild(i)
      if (!child) continue

      const childText = child.getComponent("Text") as Text
      if (childText) return childText

      const deeper = this.findFirstTextInDescendants(child)
      if (deeper) return deeper
    }
    return null
  }

  private fetchTriviaAndUpdateUI() {
    try {
      const endpointUrl = `${this.snapCloudRequirements.getFunctionsApiUrl()}${this.functionName}`

      const objectTrimmed = this.object ? this.object.trim() : ""
      const topicTrimmed = this.topic ? this.topic.trim() : ""

      const payload: any = {}
      if (objectTrimmed.length > 0) payload.object = objectTrimmed
      if (topicTrimmed.length > 0) payload.topic = topicTrimmed

      this.log(`Calling Edge Function: ${endpointUrl}`)
      this.log(`Payload object=${payload.object ?? "(none)"} topic=${payload.topic ?? "(none)"}`)

      const request = RemoteServiceHttpRequest.create()
      request.url = endpointUrl
      request.headers = this.snapCloudRequirements.getSupabaseHeaders()
      request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post
      request.body = JSON.stringify(payload)

      this.internetModule.performHttpRequest(request, (response) => {
        this.log(`Edge Function response status: ${response.statusCode}`)

        if (response.statusCode !== 200) {
          this.log(`Edge Function error body: ${response.body}`)
          return
        }

        this.handleEdgeFunctionResponse(response.body)
      })
    } catch (e) {
      this.log(`Error preparing request: ${e}`)
    }
  }

  private handleEdgeFunctionResponse(body: string) {
    try {
      const result = JSON.parse(body)

      if (result.ok !== true) {
        this.log(`Edge Function returned ok=false. body=${body}`)
        return
      }

      const record = result.record
      if (!record) {
        this.setQuestionText("No trivia found.")
        this.setOptionButtonsEnabled(false)
        return
      }

      const question = record.question ?? ""
      this.setQuestionText(String(question))

      const optionCount = Number(record.optionCount ?? 0)

      const o1 = record.option1 ?? ""
      const o2 = record.option2 ?? ""
      const o3 = record.option3 ?? ""
      const o4 = record.option4 ?? ""

      this.setOptionText(0, o1)
      this.setOptionText(1, o2)
      this.setOptionText(2, o3)
      this.setOptionText(3, o4)

      this.optionButton1.enabled = optionCount >= 1
      this.optionButton2.enabled = optionCount >= 2
      this.optionButton3.enabled = optionCount >= 3
      this.optionButton4.enabled = optionCount >= 4

      this.log(`Updated UI. optionCount=${optionCount}`)
      this.log(`Trivia Row (record): ${JSON.stringify(record)}`)
    } catch (e) {
      this.log(`Error parsing Edge Function response JSON: ${e}`)
      this.log(`Raw body: ${body}`)
    }
  }

  private setQuestionText(textValue: string) {
    if (!this.questionText) return
    this.questionText.text = textValue
  }

  private setOptionButtonsEnabled(enabled: boolean) {
    if (this.optionButton1) this.optionButton1.enabled = enabled
    if (this.optionButton2) this.optionButton2.enabled = enabled
    if (this.optionButton3) this.optionButton3.enabled = enabled
    if (this.optionButton4) this.optionButton4.enabled = enabled
  }

  private setOptionText(index: number, value: any) {
    const t = this.optionTexts[index]
    if (!t) {
      this.log(`Warning: missing child Text component for option ${index + 1}`)
      return
    }
    t.text = String(value ?? "")
  }

  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[CustomEdgeFunctionObjectTopicUI] ${message}`)
    }
  }

  public callFunction() {
    this.fetchTriviaAndUpdateUI()
  }
}