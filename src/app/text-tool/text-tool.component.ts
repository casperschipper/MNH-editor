import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-text-tool',
  templateUrl: './text-tool.component.html',
  styleUrls: ['./text-tool.component.css']
})
export class TextToolComponent implements OnInit {
  response = '';

  textChange($event) {
    this.response = $event.target.value;
  }

  ngOnInit() {
  }

}
