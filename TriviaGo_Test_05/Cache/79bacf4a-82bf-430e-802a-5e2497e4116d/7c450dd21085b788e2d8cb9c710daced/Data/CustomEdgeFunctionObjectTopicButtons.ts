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

  // If the child text node has a different name in your hierarchy, set it here.
  @input
  @hint("Name of the child Text sceneobject inside each RectangleButton (optional). Leave empty to use first Text child found.")
  public optionButtonChildTextName: string = ""

  // ===== Internal =====
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

    this.log("Cached option button child text nodes.")
  }

  private findButtonChildText(btn: RectangleButton): Text | null {
    if (!btn) return null

    // RectangleButton is a component; we use its object hierarchy
    const rootObj: SceneObject = btn.getSceneObject()

    if (!rootObj) return null

    // Strategy:
    // - If optionButtonChildTextName is provided: search by name
    // - Else: use first descendant that is a Text component
    if (this.optionButtonChildTextName && this.optionButtonChildTextName.length > 0) {
      const named = rootObj.find(this.optionButtonChildTextName)
      if (named) {
        const t = named.getComponent("Text") as Text
        if (t) return t
      }
    }

    // Fallback: find first Text component in children
    // (Lens Studio doesn't always provide a direct easy API; we do a recursive search)
    return this.findFirstTextInChildren(rootObj)
  }

  private findFirstTextInChildren(obj: SceneObject): Text | null {
    const children = obj.getChildren()
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const t = child.getComponent("Text") as Text
      if (t) return t
      const deeper = this.findFirstTextInChildren(child)
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

      // ===== Question =====
      const question = record.question ?? ""
      this.setQuestionText(String(question))

      // ===== Options =====
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

  // Optional helper if you need to trigger manually
  public callFunction() {
    this.fetchTriviaAndUpdateUI()
  }
}