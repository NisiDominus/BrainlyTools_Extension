import HideElement from "@root/helpers/HideElement";
import { Flex, Select } from "@style-guide";
import type { FlexElementType } from "@style-guide/Flex";
import type FiltersType from "../Filters";
import Subject from "./Subject";

export default class Subjects {
  main: FiltersType;
  subjects: Subject[];

  container: FlexElementType;
  subjectSelect: Select;

  selectedSubject: Subject;

  constructor(main: FiltersType) {
    this.main = main;
    this.subjects = [];

    this.Render();
    this.InitSubjects();
  }

  Render() {
    this.container = Flex({
      grow: true,
      margin: "xxs",
      // marginRight: "s",
      children: (this.subjectSelect = new Select({
        fullWidth: true,
        onChange: this.SubjectChanged.bind(this),
      })),
    });

    this.Show();
  }

  InitSubjects() {
    const allSubjects = new Subject(this, {
      id: 0,
      name: System.data.locale.reportedContents.subjectFilterFirstOption,
    });

    this.selectedSubject = allSubjects;

    this.subjects.push(allSubjects);

    System.data.Brainly.defaultConfig.config.data.subjects.forEach(data => {
      if (data.enabled) this.subjects.push(new Subject(this, data));
    });
  }

  SubjectChanged() {
    if (!this.main.main.IsSafeToFetchReports()) return;

    this.AssignSelectedSubject();

    if (!this.selectedSubject) {
      this.main.main.main.queue.filtersPanel.filter.subject.Show();

      return;
    }

    this.main.main.pageNumbers.Toggle();
    this.main.main.main.queue.filter.byName.attachmentLength.HideLabel();
    this.main.main.FetchReports({ resetStore: true });

    if (this.selectedSubject.data.id === 0)
      this.main.main.main.queue.filtersPanel.filter.subject.Show();
    else {
      this.main.main.main.queue.filtersPanel.filter.subject.Hide();
      this.main.main.main.queue.filter.byName.subject.HideLabel();
    }
  }

  AssignSelectedSubject() {
    const selectedOption = this.subjectSelect.select.selectedOptions[0];

    this.selectedSubject = this.subjects.find(
      subject => subject.option === selectedOption,
    );
  }

  IsChanged() {
    return !!this.selectedSubject?.data.id;
  }

  Show() {
    this.main.filtersContainer.prepend(this.container);
  }

  Hide() {
    this.selectedSubject = null;
    this.subjectSelect.select.selectedIndex = 0;

    HideElement(this.container);
  }
}
