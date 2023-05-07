import { Component, Input } from '@angular/core';
import { FormGroup, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input({required: true}) form!: FormGroup;

}
