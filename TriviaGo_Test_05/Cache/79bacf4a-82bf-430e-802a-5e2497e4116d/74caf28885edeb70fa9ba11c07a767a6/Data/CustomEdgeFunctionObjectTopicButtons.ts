import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton"
import { SnapCloudRequirements } from "../SnapCloudRequirements"

@component
export class CustomEdgeFunctionObjectTopicUI extends BaseScriptComponent {
  private internetModule: InternetModule = require("LensStudio:InternetModule")

  @input public snapCloudRequirements: SnapCloudRequirements
  @input public functionName: string = "[your-function-name]"
  @input public object: string = ""
  @input public topic: string = ""
  @input public enableDebugLogs: boolean = true

  @input public processButton: RectangleButton

  @input public questionText: Text

  @input public optionButton1: RectangleButton
  @input public optionButton2: RectangleButton
  @input public optionButton3: RectangleButton
  @input public optionButton4: RectangleButton

  @input public optionButtonChildTextName: string = ""

  private optionTexts: (Text | null)[] = [null, null, null, null]
  private correctAnswer: number = 0
  private isAnswerCorrect: boolean = false

  onAwake() {
    this.initializeService()
    this.cacheOptionChildTextNodes()
    this.setupProcessButton()
    //this.setupOptionButton1()
    //this.setupOptionButton2()
    //this.setupOptionButton3()
    //this.setupOptionButton4()

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
    if (!this.processButton) return

    this.processButton.onTriggerUp.add(() => {
      this.fetchTriviaAndUpdateUI()
    })
  }

  /*private setupOptionButton1() {
    if (!this.optionButton1) return

    this.optionButton1.onTriggerUp.add(()=> {
      this.checkUserAnswer(1)
    })
  }
  private setupOptionButton2() {
    if (!this.optionButton2) return  

    this.optionButton2.onTriggerUp.add(()=> {
      this.checkUserAnswer(2)
    })
  }
  private setupOptionButton3() {
    if (!this.optionButton3) return

    this.optionButton3.onTriggerUp.add(()=> {
      this.checkUserAnswer(3)
    })
  }
  private setupOptionButton4() {
    if (!this.optionButton4) return

    this.optionButton4.onTriggerUp.add(()=> {
      this.checkUserAnswer(4)
    })
  }*/

  private checkUserAnswer(index: Number) {
    if (index == this.correctAnswer)
      this.isAnswerCorrect = true;
    else 
      this.isAnswerCorrect = false;
  }

  private cacheOptionChildTextNodes() {
    this.optionTexts[0] = this.findButtonChildText(this.optionButton1)
    this.optionTexts[1] = this.findButtonChildText(this.optionButton2)
    this.optionTexts[2] = this.findButtonChildText(this.optionButton3)
    this.optionTexts[3] = this.findButtonChildText(this.optionButton4)
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

    return this.findFirstTextInDescendants(rootObj)
  }

  // ✅ FIXED: getChildrenCount / getChild
  private findChildByNameRecursive(root: SceneObject, name: string): SceneObject | null {
    if ((root as any).name === name) return root

    const count = root.getChildrenCount()
    for (let i = 0; i < count; i++) {
      const child = root.getChild(i)
      if (!child) continue

      if ((child as any).name === name) return child

      const deeper = this.findChildByNameRecursive(child, name)
      if (deeper) return deeper
    }
    return null
  }

  private findFirstTextInDescendants(root: SceneObject): Text | null {
    const rootText = root.getComponent("Text") as Text
    if (rootText) return rootText

    const count = root.getChildrenCount()
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

      const request = RemoteServiceHttpRequest.create()
      request.url = endpointUrl
      request.headers = this.snapCloudRequirements.getSupabaseHeaders()
      request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post
      request.body = JSON.stringify(payload)

      this.internetModule.performHttpRequest(request, (response) => {
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
        this.log(`Edge Function returned ok=false`)
        return
      }

      const record = result.record
      if (!record) {
        this.setQuestionText("No trivia found.")
        this.setOptionButtonsEnabled(false)
        return
      }

      this.correctAnswer = Number(record.answer ?? 0)

      this.setQuestionText(String(record.question ?? ""))

      const optionCount = Number(record.optionCount ?? 0)

      this.setOptionText(0, record.option1 ?? "")
      this.setOptionText(1, record.option2 ?? "")
      this.setOptionText(2, record.option3 ?? "")
      this.setOptionText(3, record.option4 ?? "")

      this.optionButton1.enabled = optionCount >= 1
      this.optionButton2.enabled = optionCount >= 2
      this.optionButton3.enabled = optionCount >= 3
      this.optionButton4.enabled = optionCount >= 4
    } catch (e) {
      this.log(`Error parsing Edge Function response JSON: ${e}`)
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
    if (!t) return
    t.text = String(value ?? "")
  }

  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[CustomEdgeFunctionObjectTopicUI] ${message}`)
    }
  }
}