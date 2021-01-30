import type {
  CommentDataInTicketType,
  RemoveCommentReqDataType,
  UsersDataInReportedContentsType,
} from "@BrainlyAction";
import Action from "@BrainlyAction";
import DeleteSection from "@components/DeleteSection2/DeleteSection";
import Build from "@root/helpers/Build";
import HideElement from "@root/helpers/HideElement";
import IsVisible from "@root/helpers/IsVisible";
import {
  Avatar,
  Box,
  Breadcrumb,
  Button,
  Flex,
  Icon,
  SeparatorHorizontal,
  Text,
} from "@style-guide";
import type { FlexElementType } from "@style-guide/Flex";
import QuickActionButtonsForComment from "../QuickActionButtons/Comment";
import type CommentSectionClassType from "./CommentSection";

export default class Comment {
  #container: FlexElementType;
  private owner: {
    data: UsersDataInReportedContentsType;
    profileLink: string;
    avatarLink: string;
  };

  private contentBox?: Box;
  private deleteSection: DeleteSection;
  private quickActionButtons?: QuickActionButtonsForComment;
  private reportDetailsBox: FlexElementType;
  private contentContainer: FlexElementType;
  private contentContainerWrapper: FlexElementType;
  private deleteSectionContainer: FlexElementType;
  private ignoreButton: Button;
  private ignoreButtonIcon: Icon;
  ignored: boolean;

  constructor(
    private main: CommentSectionClassType,
    public data: CommentDataInTicketType,
  ) {
    this.main = main;
    this.data = data;
  }

  get container() {
    if (!this.#container) {
      this.SetOwner();
      this.Render();
    }

    return this.#container;
  }

  SetOwner() {
    const owner = this.main.main.main.usersData.find(
      user => user.id === this.data.user_id,
    );

    if (!owner) {
      console.error("Can't find owner details");
      // this.main.FinishModeration();

      return;
    }

    this.owner = {
      data: owner,
      profileLink: System.createProfileLink(owner),
      avatarLink: System.ExtractAvatarURL(owner),
    };
  }

  Render() {
    const createdTimeEntry = this.main.main.CreateTimeEntry(this.data.created);

    this.#container = Build(
      Flex({
        direction: "column",
        borderTop: !this.data.report && !this.data.deleted,
        borderBottom: !this.data.report && !this.data.deleted,
        marginTop: "xxs",
        marginBottom: "xxs",
        onTouchStart: this.ShowQuickActionButtons.bind(this),
        onMouseEnter: this.ShowQuickActionButtons.bind(this),
        onMouseLeave: this.HideQuickActionButtons.bind(this),
      }),
      [
        [
          (this.contentBox = new Box({
            padding: "xs",
            border: false,
            thinBorder: true,
          })),
          [
            [
              (this.contentContainerWrapper = Flex({
                relative: true,
                alignItems: "center",
              })),
              [
                [
                  (this.contentContainer = Flex({
                    fullWidth: true,
                    direction: "column",
                  })),
                  [
                    [
                      Flex({
                        justifyContent: "space-between",
                      }),
                      [
                        [
                          Flex({
                            marginRight: "xs",
                            alignItems: "center",
                          }),
                          [
                            System.checkUserP(37) &&
                              !this.data.deleted && [
                                Flex({
                                  marginRight: "xs",
                                  className: "ext-corner-button-container",
                                }),
                                (this.ignoreButton = new Button({
                                  size: "xs",
                                  type: "transparent-light",
                                  iconOnly: true,
                                  icon: (this.ignoreButtonIcon = new Icon({
                                    color: "adaptive",
                                    type: "unseen",
                                  })),
                                  onClick: this.ToggleIgnoredState.bind(this),
                                })),
                              ],
                            [
                              Flex({ marginRight: "xs" }),
                              new Avatar({
                                size: "xs",
                                target: "_blank",
                                link: this.owner.profileLink,
                                imgSrc: this.owner.avatarLink,
                              }),
                            ],
                            [
                              Flex(),
                              Text({
                                size: "xsmall",
                                breakWords: true,
                                html: this.data.content,
                              }),
                            ],
                          ],
                        ],
                        [
                          Flex({ alignItems: "center" }),
                          Text({
                            noWrap: true,
                            size: "xsmall",
                            children: createdTimeEntry.node,
                          }),
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
    );

    this.RenderReportDetails();

    if (this.data.deleted) {
      this.Deleted();
    }
  }

  RenderReportDetails() {
    const { report } = this.data;

    if (!report) return;

    this.contentBox.ShowBorder();
    this.contentBox.ChangeBorderColor("peach-secondary");

    const reporter = this.main.main.main.usersData.find(
      user => user.id === report.user.id,
    );

    const reportTimeEntry = this.main.main.CreateTimeEntry(report.created);

    this.reportDetailsBox = Build(
      Flex({
        fullWidth: true,
        direction: "column",
      }),
      [
        [
          Flex(),
          [
            [
              Flex({ grow: true }),
              [
                [
                  Flex({ direction: "column" }),
                  [
                    new Breadcrumb({
                      elements: [
                        Text({
                          tag: "span",
                          size: "xsmall",
                          weight: "bold",
                          color: "blue-dark",
                          text: reporter.nick,
                          target: "_blank",
                          href: System.createProfileLink(reporter),
                        }),
                        ...reporter.ranks.names.map(rankName =>
                          Text({
                            tag: "span",
                            size: "xsmall",
                            text: rankName,
                            style: {
                              color: reporter.ranks.color,
                            },
                          }),
                        ),
                      ],
                    }),
                    Text({
                      size: "xsmall",
                      html: report.abuse.name,
                    }),
                    report.abuse.data &&
                      Text({
                        size: "xsmall",
                        blockquote: true,
                        html: report.abuse.data,
                      }),
                  ],
                ],
              ],
            ],
            [
              Flex({ alignItems: "center" }),
              Text({
                size: "xsmall",
                children: reportTimeEntry.node,
              }),
            ],
          ],
        ],
        SeparatorHorizontal({ type: "short-spaced" }),
      ],
    );

    this.contentContainer.prepend(this.reportDetailsBox);
  }

  private ToggleIgnoredState() {
    if (this.data.deleted) return;

    this.ignored = !this.ignored;

    this.ChangeIgnoredState();
  }

  ChangeIgnoredState() {
    if (this.ignored !== true) {
      this.ignoreButtonIcon?.ChangeType("unseen");
      this.ignoreButton?.ChangeType({ type: "transparent-light" });
      this.contentBox?.ChangeColor();
      this.ShowQuickActionButtons();

      return;
    }

    this.HideQuickActionButtons();
    this.contentBox?.ChangeColor("strips");
    this.ignoreButtonIcon?.ChangeType("seen");
    this.ignoreButton?.ChangeType({ type: "outline" });
  }

  ShowQuickActionButtons() {
    if (this.ignored || this.data.deleted || this.main.main.deleted) return;

    if (!this.quickActionButtons) {
      this.RenderQuickActionButtons();
    }

    this.contentContainerWrapper.append(this.quickActionButtons.container);
  }

  RenderQuickActionButtons() {
    this.quickActionButtons = new QuickActionButtonsForComment(this);
    /* this.quickActionButtonContainer = Flex({
      className: "ext-action-buttons",
    }); */
    this.quickActionButtons.container.classList.add("ext-action-buttons");

    this.contentContainerWrapper.append(this.quickActionButtons.container);
  }

  HideQuickActionButtons() {
    this.quickActionButtons?.Hide();
  }

  ToggleDeleteSection() {
    if (!IsVisible(this.deleteSectionContainer)) {
      this.OpenDeleteSection();
    } else {
      this.HideDeleteSection();
    }
  }

  OpenDeleteSection() {
    if (this.data.deleted || this.main.main.deleted) return;

    if (!this.deleteSection) {
      this.RenderDeleteSection();
    }

    this.contentBox.element.append(this.deleteSectionContainer);
  }

  HideDeleteSection() {
    HideElement(this.deleteSectionContainer);
  }

  RenderDeleteSection() {
    this.deleteSection = new DeleteSection({
      defaults: {
        contentType: "Comment",
      },
      listeners: {
        onDeleteButtonClick: this.DeleteSectionButtonClicked.bind(this),
      },
    });
    this.deleteSectionContainer = Flex({
      tag: "div",
      marginTop: "xs",
      direction: "column",
      children: this.deleteSection.container,
    });
  }

  DeleteSectionButtonClicked() {
    this.ConfirmDeletion(this.deleteSection.PrepareData());
  }

  async ConfirmDeletion(data: RemoveCommentReqDataType) {
    if (!data) return;

    const confirmMessage = System.data.locale.common.moderating.doYouWantToDeleteWithReason
      .replace("%{reason_title}", data.reason_title)
      .replace("%{reason_message}", data.reason);

    if (!confirm(confirmMessage)) {
      this.quickActionButtons.EnableButtons();

      return;
    }

    this.Delete(data);
  }

  async Delete(data: RemoveCommentReqDataType) {
    try {
      // const resDelete: import("@BrainlyAction").CommonResponseDataType = {
      //   success: true,
      //   // message: "Failed",
      // };

      // TODO delete this comment
      // console.log({
      //   ...data,
      //   model_id: this.data.id,
      // });
      // await System.TestDelay();

      const resDelete = await new Action().RemoveComment({
        ...data,
        model_id: this.data.id,
      });

      if (!resDelete) throw Error("Empty response");

      if (resDelete.success === false) {
        throw resDelete.message
          ? { msg: resDelete.message }
          : resDelete || Error("No response");
      }

      this.Deleted();
    } catch (error) {
      console.error(error);
      this.quickActionButtons?.EnableButtons();
      this.main.main.main.modal.Notification({
        type: "error",
        html:
          error.msg ||
          System.data.locale.common.notificationMessages.somethingWentWrong,
      });
    }
  }

  Deleted() {
    this.data.deleted = true;

    this.quickActionButtons?.Hide();
    HideElement(this.deleteSectionContainer);
    this.contentBox?.ChangeColor("peach-secondary");
    this.main.main.main.listeners.onModerate(this.data.id, "delete", "Comment");
  }

  ConfirmConfirming() {
    if (!this.quickActionButtons.selectedButton) return;

    if (
      !confirm(
        System.data.locale.userContent.notificationMessages
          .doYouWantToConfirmThisContent,
      )
    ) {
      this.quickActionButtons.EnableButtons();

      return;
    }

    this.Confirm();
  }

  async Confirm() {
    try {
      const resConfirm = await new Action().ConfirmComment(this.data.id);

      if (!resConfirm) throw Error("Empty response");

      if (resConfirm.success === false) {
        throw resConfirm.message
          ? { msg: resConfirm.message }
          : resConfirm || Error("No response");
      }

      this.Confirmed();
    } catch (error) {
      console.error(error);
      this.quickActionButtons.EnableButtons();
      this.main.main.main.modal.Notification({
        type: "error",
        html:
          error.msg ||
          System.data.locale.common.notificationMessages.somethingWentWrong,
      });
    }
  }

  Confirmed() {
    this.HideReportDetails();
    this.contentBox.ChangeBorderColor();
    this.quickActionButtons.EnableButtons();
    this.quickActionButtons.confirmButton.Hide();
    this.main.main.main.listeners.onModerate(
      this.data.id,
      "confirm",
      "Comment",
    );
  }

  HideReportDetails() {
    delete this.data.report;

    HideElement(this.reportDetailsBox);
  }

  Hide() {
    HideElement(this.#container);
  }
}
