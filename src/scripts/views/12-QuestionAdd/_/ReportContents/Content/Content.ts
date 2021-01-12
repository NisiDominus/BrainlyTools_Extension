import Action, {
  ModerationTicketDataType,
  RemoveAnswerReqDataType,
  RemoveCommentReqDataType,
  RemoveQuestionReqDataType,
  ReportedContentDataType,
  UserDataInReportType,
  UsersDataInReportedContentsType,
} from "@BrainlyAction";
import type { RankDataType } from "@BrainlyReq/GetMarketConfig";
import type { ModeratorDataType } from "@BrainlyReq/LiveModerationFeed";
import CreateElement from "@components/CreateElement";
import type { ContentNameType } from "@components/ModerationPanel/ModeratePanelController";
import type QuickActionButtons from "@components/QuickActionButtons/QuickActionButtons";
import Build from "@root/helpers/Build";
import HideElement from "@root/helpers/HideElement";
import InsertAfter from "@root/helpers/InsertAfter";
import IsVisible from "@root/helpers/IsVisible";
import replaceLatexWithURL from "@root/helpers/replaceLatexWithURL";
import { Avatar, Box, Button, Flex, Icon, Spinner, Text } from "@style-guide";
import type { BoxColorType } from "@style-guide/Box";
import type { ButtonColorType } from "@style-guide/Button";
import type { FlexElementType } from "@style-guide/Flex";
import type { IconColorType } from "@style-guide/Icon";
import type { TextElement } from "@style-guide/Text";
import moment from "moment-timezone";
import tippy, { Instance } from "tippy.js";
import type ReportedContentsType from "../ReportedContents";

type StatusNamesType =
  | "default"
  | "deleted"
  | "confirmed"
  | "failed"
  | "reserved"
  | "moderating";

const STATUS_COLOR: {
  [x in StatusNamesType]: BoxColorType;
} = {
  default: "light",
  deleted: "peach-secondary-light",
  confirmed: "mint-secondary-light",
  failed: "dark",
  reserved: "gray-secondary-lightest",
  moderating: "blue-secondary-light",
};

const CONTENT_TYPE_ICON_COLOR: {
  Question: ButtonColorType;
  Answer: ButtonColorType;
  Comment: ButtonColorType;
} = {
  Question: { type: "solid-blue" },
  Answer: { type: "solid-mint" },
  Comment: { type: "solid" },
};

type UserType = {
  nick: string;
  profileLink: string;
  data: UsersDataInReportedContentsType;
  specialRank?: RankDataType;
  specialRankColor?: string;
};

export default class Content {
  private main: ReportedContentsType;
  data: ReportedContentDataType;
  globalId: string;
  contentType: ContentNameType;

  users: {
    reporter?: UserType;
    reported: UserType;
  };

  dates: {
    create: {
      moment: moment.Moment;
      tzFormatted: string;
      localFormatted: string;
      lastPrintedRelativeTime: string;
    };
    report?: {
      moment: moment.Moment;
      tzFormatted: string;
      localFormatted: string;
      lastPrintedRelativeTime: string;
    };
  };

  has: StatusNamesType;
  hasAlso: "already";

  container: HTMLDivElement;
  contentWrapper: FlexElementType;
  private box: Box;
  private moderateActionContainer: FlexElementType;
  moderateButton: Button;
  private createDateText: TextElement<"i">;
  private reportDateText: TextElement<"span">;
  private reportDetailContainer: FlexElementType;
  protected buttonSpinner: HTMLDivElement;
  private moderatorContainer: FlexElementType;
  #extraDetailsContainer: FlexElementType;
  tippyInstances: Instance[];
  private moderateButtonContainer: FlexElementType;
  ignored: boolean;
  private ignoreButton?: Button;
  private ignoreButtonContainer?: FlexElementType;
  private ignoreButtonIcon?: Icon;
  private reportFlagIcon: Icon;
  contentTypeButtonContainer: FlexElementType;
  protected quickActionButtons?: QuickActionButtons;
  private contentContainer: FlexElementType;

  constructor({
    main,
    data,
    contentType,
  }: {
    main: ReportedContentsType;
    data: ReportedContentDataType;
    contentType: ContentNameType;
  }) {
    this.main = main;
    this.data = data;
    this.contentType = contentType;

    // this.quickDeleteButtons = [];
    this.tippyInstances = [];
    this.globalId = btoa(`${contentType.toLowerCase()}:${data.model_id}`);

    this.users = {
      reporter: this.PrepareUser(data.report?.user),
      reported: this.PrepareUser(data.user),
    };

    this.SetDates();
  }

  private PrepareUser(userData: UserDataInReportType) {
    if (!userData) return undefined;

    const data = this.main.userData[userData?.id || 0];

    const user: UserType = {
      nick: (data.nick || "").toLowerCase(),
      profileLink: System.createProfileLink(data),
      data,
    };

    if (data.ranks_ids) {
      const specialRankIdWithDifferentColor = data.ranks_ids.find(id => {
        const rank =
          System.data.Brainly.defaultConfig.config.data.ranksWithId[id];

        return rank?.type === 5;
      });
      const rank =
        System.data.Brainly.defaultConfig.config.data.ranksWithId[
          specialRankIdWithDifferentColor
        ];

      if (rank) {
        user.specialRank = rank;

        if (rank.color !== "000000" && rank.color !== "000") {
          user.specialRankColor = rank.color;

          if (!rank.color.startsWith("#"))
            user.specialRankColor = `#${rank.color}`;
        }
      }
    }

    return user;
  }

  private SetDates() {
    moment.locale(navigator.language);

    const createDate = moment(this.data?.created);
    const createDateTz = moment(this.data?.created).tz(
      System.data.Brainly.defaultConfig.config.data.config.timezone,
    );

    this.dates = {
      create: {
        moment: createDate,
        tzFormatted: createDateTz.format("L LT Z"),
        localFormatted: createDate.format("L LT"),
        lastPrintedRelativeTime: "",
      },
    };

    if (this.data.report) {
      const reportDate = moment(this.data.report?.created);
      const reportDateTz = moment(this.data.report?.created).tz(
        System.data.Brainly.defaultConfig.config.data.config.timezone,
      );

      this.dates.report = {
        moment: reportDate,
        tzFormatted: reportDateTz.format("L LT Z"),
        localFormatted: reportDate.format("L LT"),
        lastPrintedRelativeTime: "",
      };
    }
  }

  Render() {
    this.container = CreateElement({
      tag: "div",
      className: "report-item-wrapper r-c-b-c",
      onMouseEnter: this.ShowActionButtons.bind(this),
      onTouchStart: this.ShowActionButtons.bind(this),
      onMouseLeave: this.HideActionButtons.bind(this),
    });

    this.RenderContent();
    this.CalculateHeight();
  }

  async CalculateHeight() {
    if (!this.main.defaults.lazyQueue) return;

    await System.Delay(100);

    const { clientHeight } = this.container;

    this.container.style.minHeight = `${clientHeight}px`;
  }

  RenderContent() {
    const subjectData = System.data.Brainly.defaultConfig.config.data.subjects.find(
      data => data.id === this.data.subject_id,
    );

    let reportFlagColor: IconColorType = "blue";

    if ("corrected" in this.data) {
      reportFlagColor = this.data.corrected ? "mint" : "blue";
    } else if (this.data.report) {
      reportFlagColor = "peach";
    }

    const authorProfileLink = System.createBrainlyLink("question", {
      id: this.data.task_id,
    });

    this.contentWrapper = Build(
      Flex({
        direction: "column",
        // className: "",
        relative: true,
        fullHeight: true,
      }),
      [
        [
          (this.box = new Box({
            border: false,
            fullHeight: true,
            padding: "s",
          })),
          [
            [
              Flex({
                direction: "column",
                fullHeight: true,
                justifyContent: "space-between",
              }),
              [
                [
                  Flex({
                    noShrink: true,
                    fullWidth: true,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }),
                  [
                    [
                      Flex({ marginRight: "s", wrap: true, grow: true }),
                      [
                        [
                          Flex({
                            marginRight: "s",
                          }),
                          [
                            [
                              (this.contentTypeButtonContainer = Flex({
                                wrap: true,
                                alignItems: "center",
                                justifyContent: "center",
                              })),
                              new Button({
                                ...CONTENT_TYPE_ICON_COLOR[this.contentType],
                                size: "s",
                                iconOnly: true,
                                icon: Text({
                                  breakWords: true,
                                  color: "white",
                                  text: this.contentType[0],
                                }),
                                tag: "a",
                                target: "_blank",
                                href: authorProfileLink,
                              }),
                            ],
                            [
                              Flex({
                                marginLeft: "xs",
                                alignItems: "center",
                                direction: "column",
                                tag: "a",
                                target: "_blank",
                                href: authorProfileLink,
                              }),
                              [
                                Text({
                                  href: "",
                                  size: "small",
                                  weight: "bold",
                                  text: subjectData.name,
                                }),
                                Text({
                                  href: "",
                                  size: "small",
                                  weight: "bold",
                                  text: this.data.task_id,
                                }),
                              ],
                            ],
                          ],
                        ],
                        [
                          Flex({ direction: "column" }),
                          [
                            [
                              Flex({ alignItems: "center" }),
                              Text({
                                breakWords: true,
                                tag: "a",
                                size: "small",
                                weight: "bold",
                                target: "_blank",
                                text: this.users.reported.data.nick,
                                href: this.users.reported.profileLink,
                                style: this.users.reported.specialRankColor && {
                                  color: this.users.reported.specialRankColor,
                                },
                              }),
                            ],
                            [
                              Flex({
                                alignItems: "center",
                              }),
                              (this.createDateText = Text({
                                tag: "span",
                                size: "xsmall",
                                weight: "bold",
                                breakWords: true,
                                color: "gray-secondary",
                                title: `${this.dates.create.localFormatted}\n${this.dates.create.tzFormatted}`,
                              })),
                            ],
                          ],
                        ],
                      ],
                    ],
                    [
                      (this.moderateActionContainer = Flex({
                        wrap: true,
                        direction: "row-reverse",
                      })),
                      [
                        [
                          (this.moderateButtonContainer = Flex({
                            marginLeft: "xs",
                          })),
                          (this.moderateButton = new Button({
                            type: "outline",
                            toggle: "blue",
                            iconOnly: true,
                            onClick: this.Moderate.bind(this),
                            icon: new Icon({
                              type: "ext-shield",
                              color: "adaptive",
                            }),
                          })),
                        ],
                      ],
                    ],
                  ],
                ],
                [
                  (this.contentContainer = Flex({
                    marginTop: "s",
                    marginBottom: "m",
                    grow: true,
                  })),
                  Text({
                    breakWords: true,
                    size: "small",
                    html: replaceLatexWithURL(this.data.content_short, {
                      decode: true,
                    }),
                  }),
                ],
                [
                  Flex({
                    wrap: true,
                    relative: true,
                    className: "footer",
                    justifyContent: "space-between",
                  }),
                  [
                    [
                      (this.reportDetailContainer = Flex({
                        className: "footer-left-side", // TODO remove this className
                      })),
                      [
                        [
                          Flex({
                            marginLeft: "xxs",
                            marginRight: "xxs",
                            alignItems: "center",
                          }),
                          (this.reportFlagIcon = new Icon({
                            type: "report_flag",
                            color: reportFlagColor,
                          })),
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
        System.checkUserP(18) && [
          (this.ignoreButtonContainer = Flex({
            className: "ext-corner-button-container",
          })),
          (this.ignoreButton = new Button({
            size: "s",
            type: "transparent-light",
            iconOnly: true,
            icon: (this.ignoreButtonIcon = new Icon({
              color: "adaptive",
              type: "unseen",
            })),
            onClick: this.ToggleIgnoredState.bind(this),
          })),
        ],
      ],
    );

    this.container.append(this.contentWrapper);

    if (this.has) {
      this.ChangeBoxColor();
    }

    if (this.ignored === true) {
      this.ChangeIgnoredState();
    }

    this.RenderExtraDetails();
    this.RenderButtonSpinner();

    if (this.data.report) {
      this.RenderReportDetails();
    }

    this.TryToRenderButtons();

    this.tippyInstances.push(
      tippy(this.moderateButton.element, {
        theme: "light",
        content: Text({
          size: "small",
          weight: "bold",
          children: System.data.locale.common.moderating.moderate,
        }),
      }),
    );

    if (this.ignoreButtonContainer) {
      this.tippyInstances.push(
        tippy(this.ignoreButtonContainer, {
          theme: "light",
          content: Text({
            size: "small",
            weight: "bold",
            children:
              System.data.locale.reportedContents.massModerate.ignoreContent,
          }),
        }),
      );
    }

    if ("corrected" in this.data) {
      this.tippyInstances.push(
        tippy(this.reportFlagIcon.element, {
          theme: "light",
          content: Text({
            size: "small",
            weight: "bold",
            children: this.data.corrected
              ? System.data.locale.moderationPanel.corrected
              : System.data.locale.reportedContents.queue.notYetCorrected,
          }),
        }),
      );
    }
  }

  DestroyContent() {
    if (!this.contentWrapper) return;

    this.tippyInstances.forEach(instance => instance.destroy());
    this.tippyInstances = [];

    this.box = null;
    this.moderateActionContainer = null;
    this.moderateButton = null;
    this.createDateText = null;
    this.reportDateText = null;
    this.reportDetailContainer = null;
    this.buttonSpinner = null;
    this.moderatorContainer = null;
    this.#extraDetailsContainer = null;
    this.quickActionButtons = null;
    this.ignoreButton = null;
    this.ignoreButtonIcon = null;

    this.contentWrapper.remove();
    this.contentWrapper = null;
  }

  ChangeBoxColor() {
    if (!this.box) return;

    const boxColor: BoxColorType =
      this.hasAlso === "already"
        ? "mustard-secondary"
        : STATUS_COLOR[this.has] || STATUS_COLOR.default;

    this.box.ChangeColor(boxColor);
  }

  // eslint-disable-next-line class-methods-use-this
  RenderExtraDetails() {
    //
  }

  get extraDetailsContainer() {
    if (!this.#extraDetailsContainer) {
      this.RenderExtraDetailsContainer();
    }

    return this.#extraDetailsContainer;
  }

  RenderExtraDetailsContainer() {
    this.#extraDetailsContainer = Flex({
      alignItems: "center",
      marginBottom: "s",
    });

    InsertAfter(this.#extraDetailsContainer, this.contentContainer);
  }

  async TryToRenderButtons() {
    if (
      (!document.documentElement.classList.contains("mobile") &&
        !this.main.queueContainer.classList.contains(
          "buttons-visibility-always",
        )) ||
      (document.documentElement.classList.contains("mobile") &&
        this.main.queueContainer.classList.contains(
          "buttons-visibility-on-hover",
        ))
    ) {
      this.HideActionButtons();

      return;
    }

    this.RenderQuickActionButtons();
    this.ShowActionButtons();
  }

  private ShowActionButtons() {
    if (!this.contentWrapper) {
      this.RenderContent();
    }

    if (
      IsVisible(this.quickActionButtons?.container) ||
      this.has === "deleted" ||
      this.ignored
    )
      return;

    if (
      this.main.queue.focusedContent &&
      this.main.queue.focusedContent !== this
    )
      this.main.queue.focusedContent.HideActionButtons();

    if (!this.quickActionButtons) {
      this.RenderQuickActionButtons();
    }

    if (!this.quickActionButtons) return;

    this.main.queue.focusedContent = this;

    InsertAfter(
      this.quickActionButtons.container,
      (!document.documentElement.classList.contains("mobile") &&
        this.main.queueContainer.classList.contains(
          "buttons-visibility-always",
        )) ||
        (document.documentElement.classList.contains("mobile") &&
          !this.main.queueContainer.classList.contains(
            "buttons-visibility-on-hover",
          ))
        ? this.reportDetailContainer
        : this.reportDetailContainer.parentElement,
    );
  }

  private HideActionButtons() {
    if (
      this.has !== "deleted" &&
      (IsVisible(this.buttonSpinner) ||
        (!document.documentElement.classList.contains("mobile") &&
          this.main.queueContainer.classList.contains(
            "buttons-visibility-always",
          )) ||
        (document.documentElement.classList.contains("mobile") &&
          !this.main.queueContainer.classList.contains(
            "buttons-visibility-on-hover",
          )))
    )
      return;

    this.quickActionButtons?.Hide();
  }

  protected RenderQuickActionButtons() {
    console.warn(this);
  }

  private RenderButtonSpinner() {
    this.buttonSpinner = Spinner({ overlay: true });
  }

  private RenderReportDetails() {
    const container = Build(document.createDocumentFragment(), [
      "corrected" in this.data && [
        Flex({
          marginLeft: "xxs",
          marginRight: "xxs",
          alignItems: "center",
        }),
        new Icon({
          type: "report_flag",
          color: "peach",
        }),
      ],
      [
        Flex({
          marginRight: "s",
          direction: "column",
          justifyContent: "center",
        }),
        [
          [
            Flex(),
            this.users.reporter &&
              Text({
                tag: "a",
                size: "small",
                weight: "bold",
                target: "_blank",
                breakWords: true,
                text: this.users.reporter.data.nick,
                href: this.users.reporter.profileLink || "",
                style: this.users.reporter.specialRankColor && {
                  color: this.users.reporter.specialRankColor,
                },
              }),
          ],
          [
            Flex({
              alignItems: "center",
            }),
            (this.reportDateText = Text({
              tag: "span",
              size: "xsmall",
              color: "gray-secondary",
              weight: "bold",
              breakWords: true,
              title:
                this.dates.report &&
                `${this.dates.report.localFormatted}\n${this.dates.report.tzFormatted}`,
            })),
          ],
        ],
      ],
      [
        Flex({
          marginRight: "s",
          alignItems: "center",
        }),
        Text({
          size: "small",
          color: "gray",
          weight: "bold",
          breakWords: true,
          text: this.data.report?.abuse?.name || "",
        }),
      ],
    ]);

    this.reportDetailContainer.append(container);
  }

  RenderTimes(forceToRender?: boolean) {
    if (!this.contentWrapper || !IsVisible(this.contentWrapper)) return;

    const currentCreationTime = this.dates.create.moment.fromNow();

    if (
      forceToRender ||
      this.dates.create.lastPrintedRelativeTime !== currentCreationTime
    ) {
      this.createDateText.innerText = currentCreationTime;
      this.dates.create.lastPrintedRelativeTime = currentCreationTime;
    }

    if (this.reportDateText && this.dates.report) {
      const currentReportingTime = this.dates.report.moment.fromNow();

      if (
        this.dates.report &&
        (forceToRender ||
          this.dates.report.lastPrintedRelativeTime !== currentReportingTime)
      ) {
        this.dates.report.lastPrintedRelativeTime = currentReportingTime;
        this.reportDateText.innerText = currentReportingTime;
      }
    }
  }

  Moderate(): Promise<ModerationTicketDataType> {
    if (this.has !== "deleted") {
      this.has = "moderating";

      this.ChangeBoxColor();
    }

    this.DisableActions();
    this.moderateButton?.Disable();
    this.moderateButton?.element.append(this.buttonSpinner);

    return this.main.queue.moderationPanelController.ModerateContent(this);
  }

  async ExpressConfirm() {
    try {
      await this.Moderating();

      const resConfirm = await new Action().ConfirmContent(
        this.data.model_id,
        this.data.model_type_id,
      );
      // const resConfirm = {
      //   success: !!Math.floor(Math.random() * 2),
      //   message: "Failed",
      // };
      // await System.Delay(5000);

      // console.log(resConfirm);

      new Action().CloseModerationTicket(this.data.task_id);

      this.has = "failed";
      this.hasAlso = undefined;

      if (
        resConfirm.success === false &&
        resConfirm.code === 5 &&
        resConfirm.exception_type === 170
      ) {
        this.hasAlso = "already";

        this.Confirmed();
      }

      if (resConfirm?.success) {
        this.Confirmed();
      }

      this.ChangeBoxColor();
      this.NotModerating();

      return resConfirm;
    } catch (error) {
      console.error(error);
      this.ChangeBoxColor();
      this.NotModerating();

      return Promise.reject(error);
    }
  }

  private Moderating() {
    return this.DisableActions();
  }

  private NotModerating() {
    this.HideSpinner();
    this.EnableActions();
  }

  Confirmed() {
    this.has = "confirmed";

    this.ChangeBoxColor();
    this.quickActionButtons?.RemoveConfirmButton();
  }

  HideSpinner() {
    HideElement(this.buttonSpinner);
    this.EnableActions();
  }

  DisableActions() {
    this.container?.classList.add("operating");

    return this.quickActionButtons?.Moderating();
  }

  EnableActions() {
    this.container?.classList.remove("operating");

    this.quickActionButtons?.NotModerating();
  }

  // eslint-disable-next-line class-methods-use-this
  UserModerating(data: ModeratorDataType) {
    if (!this.moderateActionContainer) return;

    if (this.moderatorContainer) {
      this.moderatorContainer.remove();
    }

    const profileLink = System.createProfileLink(data);

    this.moderatorContainer = Build(Flex(), [
      [
        Flex({
          marginRight: "xs",
          alignItems: "center",
        }),
        Text({
          size: "small",
          weight: "bold",
          text: data.nick,
          target: "_blank",
          href: profileLink,
        }),
      ],
      [
        Flex({
          alignItems: "center",
        }),
        new Avatar({
          size: "m",
          title: data.nick,
          target: "_blank",
          link: profileLink,
          imgSrc: data.avatar,
        }),
      ],
    ]);

    this.moderateActionContainer.append(this.moderatorContainer);
  }

  async ExpressDelete(
    data:
      | RemoveQuestionReqDataType
      | RemoveAnswerReqDataType
      | RemoveCommentReqDataType,
    methodName?: "RemoveQuestion" | "RemoveAnswer" | "RemoveComment",
  ) {
    try {
      await this.DisableActions();

      const resDelete = await new Action()[methodName](
        {
          ...data,
          model_id: this.data.model_id,
        },
        true,
      );
      // console.log(methodName, {
      //   ...data,
      //   model_id: this.data.model_id,
      // });
      // const resDelete: CommonResponseDataType = {
      //   success: false,
      //   message: "There is no such question",
      //   code: 2,
      //   exception_type: 170,
      // };
      // await System.TestDelay(1, 50);

      new Action().CloseModerationTicket(this.data.task_id);

      this.has = "failed";
      this.hasAlso = undefined;

      if ("success" in resDelete) {
        // @ ts-expect-error
        if (resDelete.success === true) {
          this.Deleted();
        } else if (
          (resDelete.code === 2 || // question
            resDelete.code === 3 || // answer
            resDelete.code === 13) && // comment
          resDelete.exception_type === 170
        ) {
          this.hasAlso = "already";

          this.Deleted();
        }
      }

      this.ChangeBoxColor();
      this.NotModerating();

      return resDelete;
    } catch (error) {
      console.error(error);

      this.ChangeBoxColor();
      this.NotModerating();

      return Promise.reject(error);
    }
  }

  Deleted() {
    this.has = "deleted";

    this.ChangeBoxColor();
    this.HideActionButtons();
    this.quickActionButtons?.Hide();

    if (this.ignoreButtonContainer) {
      this.ignoreButtonContainer?.remove();

      this.ignoreButtonContainer = null;
    }
  }

  protected HideModerateButton() {
    HideElement(this.moderateButtonContainer);
  }

  private ToggleIgnoredState() {
    this.ignored = !this.ignored;

    this.ChangeIgnoredState();
  }

  ChangeIgnoredState() {
    if (this.ignored !== true) {
      this.ignoreButtonIcon?.ChangeType("unseen");
      this.ignoreButton?.ChangeType({ type: "transparent-light" });
      this.ChangeBoxColor();
      this.ShowActionButtons();

      return;
    }

    this.HideActionButtons();
    this.box?.ChangeColor("surf-crest");
    this.ignoreButtonIcon?.ChangeType("seen");
    this.ignoreButton?.ChangeType({ type: "transparent" });
  }
}
