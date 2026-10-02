#!/usr/bin/env python3
"""
Generate a 6-page PDF reproducing the handwritten lab notebook content
in computer-typed text, maintaining the same format/layout.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

WIDTH, HEIGHT = A4  # 595.27, 841.89 points


def draw_border(c, margin=1.5*cm):
    """Draw a rectangular border around the page content area."""
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    c.rect(margin, margin, WIDTH - 2*margin, HEIGHT - 2*margin)


def page1_certificate(c):
    """Page 1: Certificate page"""
    draw_border(c)
    
    margin = 1.5*cm
    inner_left = margin + 1*cm
    center_x = WIDTH / 2
    
    # Header - College Name
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(center_x, HEIGHT - 3*cm, "GOVT. POLYTECHNIC")
    c.drawCentredString(center_x, HEIGHT - 3.7*cm, "BALASORE")
    
    # Department
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(center_x, HEIGHT - 5.5*cm, "DEPARTMENT OF ELECTRICAL ENGINEERING")
    
    # Line under department
    c.setLineWidth(1)
    c.line(margin + 1*cm, HEIGHT - 6*cm, WIDTH - margin - 1*cm, HEIGHT - 6*cm)
    
    # Certificate title
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(center_x, HEIGHT - 7.5*cm, "CERTIFICATE")
    
    # Form fields
    c.setFont("Helvetica", 12)
    y = HEIGHT - 9.5*cm
    line_gap = 1.2*cm
    
    fields = [
        ("NAME", "Saroj Parida"),
        ("REGISTRATION NO", "F241100 2014"),
        ("BRANCH", "Electrical"),
        ("SECTION", "B2"),
        ("SUBJECT", "Programming for problem Solving"),
    ]
    
    for label, value in fields:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(inner_left, y, f"{label}")
        c.drawString(inner_left + 4.5*cm, y, ":")
        c.setFont("Helvetica", 11)
        c.drawString(inner_left + 5*cm, y, value)
        # Underline for value
        c.line(inner_left + 5*cm, y - 2, inner_left + 14*cm, y - 2)
        y -= line_gap
    
    # Certificate text
    y -= 1*cm
    c.setFont("Helvetica", 11)
    text_lines = [
        "This is certified to be bonafide work of the student in the",
        "Programming for problem solving laboratory (PR.2) during",
        "the academic year  2025 / 26.",
    ]
    for line in text_lines:
        c.drawString(inner_left, y, line)
        y -= 0.7*cm
    
    # Practicals certified
    y -= 0.8*cm
    c.drawString(inner_left, y, "No. of practicals certified")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left + 5.5*cm, y, "10")
    c.setFont("Helvetica", 11)
    c.drawString(inner_left + 6.2*cm, y, "out of")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left + 7.5*cm, y, "10")
    c.setFont("Helvetica", 11)
    c.drawString(inner_left + 8.5*cm, y, "in the subject of Programming for problem")
    y -= 0.7*cm
    c.drawString(inner_left, y, "solving laboratory(PR.2).")
    
    # Date and Teacher
    y -= 2*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inner_left, y, "Date:")
    c.setFont("Helvetica", 11)
    c.drawString(inner_left + 1.5*cm, y, "  26/11/25")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(WIDTH - margin - 6*cm, y, "Teacher In-Charge")
    
    c.showPage()


def page2_experiment1(c):
    """Page 2: Experiment 01 - Displaying College Name Multiple Times"""
    draw_border(c)
    
    margin = 1.5*cm
    inner_left = margin + 1*cm
    
    # Header
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, HEIGHT - 3*cm, "Expt No.:")
    c.setFont("Helvetica", 11)
    c.drawString(inner_left + 2.5*cm, HEIGHT - 3*cm, "01")
    
    c.drawRightString(WIDTH - margin - 1*cm, HEIGHT - 3*cm, "page No:    01")
    
    # Line
    c.line(inner_left, HEIGHT - 3.5*cm, WIDTH - margin - 1*cm, HEIGHT - 3.5*cm)
    
    # Title
    y = HEIGHT - 4.5*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inner_left, y, "Displaying College Name Multiple Times:")
    
    # Code
    y -= 1.2*cm
    c.setFont("Courier", 11)
    code_lines = [
        "#include <stdio.h>",
        "int main(){",
        "    int i;",
        "    for(i=1; k=20; i++){",
        '        printf("%d. Government polytechnic',
        '               Balasore\\n", i);',
        "    }",
        "    return 0;",
        "}",
    ]
    
    for line in code_lines:
        c.drawString(inner_left + 0.5*cm, y, line)
        y -= 0.6*cm
    
    # Submitted by section
    y -= 2*cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, y, "Submitted by:")
    y -= 0.8*cm
    c.setFont("Helvetica", 11)
    info_lines = [
        ("Name:", "Saroj Parida"),
        ("Reg.No:", "F241100914"),
        ("Branch:", "Electrical"),
        ("Group:", "B2"),
        ("Sem:", "3rd"),
    ]
    for label, value in info_lines:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(inner_left, y, label)
        c.setFont("Helvetica", 10)
        c.drawString(inner_left + 2*cm, y, value)
        y -= 0.6*cm
    
    c.showPage()


def page3_arrays(c):
    """Page 3: Arrays topic page"""
    draw_border(c)
    
    margin = 1.5*cm
    inner_left = margin + 1*cm
    
    # Header
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, HEIGHT - 3*cm, "Expt No.:")
    c.setFont("Helvetica", 11)
    c.drawString(inner_left + 2.5*cm, HEIGHT - 3*cm, "")
    
    c.drawRightString(WIDTH - margin - 1*cm, HEIGHT - 3*cm, "page No:    04")
    
    # Line
    c.line(inner_left, HEIGHT - 3.5*cm, WIDTH - margin - 1*cm, HEIGHT - 3.5*cm)
    
    # Title
    y = HEIGHT - 4.5*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inner_left, y, "Arrays:-")
    
    # Content
    y -= 1*cm
    c.setFont("Helvetica", 11)
    content = [
        "12. Arrays are collections of similar data elements",
        "    stored contiguously in memory.",
        "",
        "13. One-dimensional Array: Stores a list of",
        "    values (e.g. Marks of 10 students)",
        "",
        "14. Two-dimensional Arrays: Stores a table or",
        "    matrix of values (e.g. matrix[25][25]).",
    ]
    
    for line in content:
        c.drawString(inner_left, y, line)
        y -= 0.7*cm
    
    c.showPage()


def page4_operators_io_control(c):
    """Page 4: Operators, I/O, Control Structures"""
    draw_border(c)
    
    margin = 1.5*cm
    inner_left = margin + 1*cm
    
    # Header
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, HEIGHT - 3*cm, "Expt No.:")
    c.drawRightString(WIDTH - margin - 1*cm, HEIGHT - 3*cm, "page No:    02")
    
    # Line
    c.line(inner_left, HEIGHT - 3.5*cm, WIDTH - margin - 1*cm, HEIGHT - 3.5*cm)
    
    # Content
    y = HEIGHT - 4.5*cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, y, "7. Operators perform specific actions:")
    
    y -= 0.8*cm
    c.setFont("Helvetica", 11)
    operators = [
        "   \u2022 Arithmetic: +, -, *, /, % (modulus)",
        "   \u2022 Relational: <, >, <=, >=, ==, != (not)",
        "   \u2022 Logical: && (AND), || (OR), ! (NOT)",
    ]
    for line in operators:
        c.drawString(inner_left, y, line)
        y -= 0.6*cm
    
    y -= 0.5*cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, y, "Input/Output (I/O) operations:")
    
    y -= 0.8*cm
    c.setFont("Helvetica", 11)
    io_content = [
        "8. Input Function (scanf()): Reads data from the keyboard.",
        "   It requires a format specifier and the address(&) of",
        "   the variable.",
        "",
        "9. Output Function (printf()): Display data or message",
        "   to the console. It uses format specifiers to output",
        "   variable values.",
    ]
    for line in io_content:
        c.drawString(inner_left, y, line)
        y -= 0.6*cm
    
    y -= 0.5*cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, y, "Control Structures (Decision Making and Looping):")
    
    y -= 0.8*cm
    c.setFont("Helvetica", 11)
    control_content = [
        "10. Decision Making structures allow conditional execution",
        "    of code.",
        "   \u2022 if Statement: Executes code if a condition is true.",
        "   \u2022 if-else statement: Executes one block if true, another",
        "     if false.",
        "   \u2022 Switch Statement: Used for multi-way branching",
        "     based on a single variable's value.",
        "",
        "11. Looping Structures execute code repeatedly.",
        "   \u2022 for loop: Used when the number of iterations is",
        "     generally known.",
        "   \u2022 while loop: Repeats as long as a condition remains true.",
        "     (pre-test loop).",
    ]
    for line in control_content:
        c.drawString(inner_left, y, line)
        y -= 0.6*cm
    
    c.showPage()


def page5_intro_basic_structure(c):
    """Page 5: Introduction & Basic Structure of C"""
    draw_border(c)
    
    margin = 1.5*cm
    inner_left = margin + 1*cm
    
    # Header
    c.setFont("Helvetica-Bold", 11)
    c.drawString(inner_left, HEIGHT - 3*cm, "Expt No.:")
    c.setFont("Helvetica", 11)
    c.drawString(inner_left + 2.5*cm, HEIGHT - 3*cm, "01")
    c.drawRightString(WIDTH - margin - 1*cm, HEIGHT - 3*cm, "page No:    01")
    
    # Line
    c.line(inner_left, HEIGHT - 3.5*cm, WIDTH - margin - 1*cm, HEIGHT - 3.5*cm)
    
    # Title
    y = HEIGHT - 4.5*cm
    c.setFont("Helvetica-Bold", 13)
    c.drawString(inner_left, y, "Programming for Problem Solving")
    y -= 0.8*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inner_left, y, "Introduction & Basic Structure:")
    
    y -= 1*cm
    c.setFont("Helvetica", 11)
    content = [
        "1. C Programming is a general-purpose, procedural",
        "   language developed by Dennis Ritchie.",
        "",
        "2. It is widely used for system programming and as a",
        "   foundation for many other languages.",
        "",
        "3. The basic structure of a C programme includes:",
        "   \u2022 Preprocessor Directives: Instructions starting with",
        "     # (e.g. #include <stdio.h>)",
        "   \u2022 Main Function: The starting point of execution (int main()",
        "     { ... })",
        "",
        "   Data types, variables, and operators:",
        "",
        "4. Declarations: Defining variables and functions.",
        "   Executable Statements: The instructions that define",
        "   the program's logic.",
        "",
        "5. Constants: are fixed values that do not change",
        "   (e.g. Integer 10, Character 'B').",
        "",
        "6. Variables are names given to storage areas whose",
        "   values can change during execution.",
        "   Data Types define the type and size of data:",
        "   \u2022 int: for whole numbers.",
        "   \u2022 float/double: for decimal numbers.",
        "   \u2022 char: for single characters.",
    ]
    for line in content:
        c.drawString(inner_left, y, line)
        y -= 0.55*cm
    
    c.showPage()


def page6_index(c):
    """Page 6: Index page with table"""
    draw_border(c)
    
    margin = 1.5*cm
    inner_left = margin + 0.5*cm
    
    # Title
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(WIDTH/2, HEIGHT - 3.5*cm, "INDEX")
    
    # Table setup
    table_top = HEIGHT - 5*cm
    col_widths = [1.2*cm, 5.5*cm, 1.5*cm, 2.5*cm, 2.5*cm, 2.5*cm]
    col_starts = [inner_left]
    for w in col_widths[:-1]:
        col_starts.append(col_starts[-1] + w)
    
    table_width = sum(col_widths)
    row_height = 0.9*cm
    
    # Headers
    headers = ["Sl.\nNo", "Name of the Experiment", "Page\nNo.", "Date of\nexperiment", "Date of\nSubmission", "Remarks"]
    
    c.setFont("Helvetica-Bold", 8)
    header_y = table_top - 0.3*cm
    
    # Draw header row
    c.setLineWidth(1)
    c.rect(inner_left, table_top - row_height, table_width, row_height)
    
    for i, (header, start, width) in enumerate(zip(headers, col_starts, col_widths)):
        # Vertical lines
        if i > 0:
            c.line(start, table_top, start, table_top - row_height)
        # Header text
        lines = header.split('\n')
        for j, line in enumerate(lines):
            c.drawCentredString(start + width/2, header_y - j*0.3*cm, line)
    
    # Data rows
    experiments = [
        ("01", "Programming for Problem\nSolving:", "1-5", "09/09/25", "26/09/25", ""),
        ("02", "Displaying College Name\nMultiple times", "6", "16/09/25", "23/09/25", ""),
        ("03", "Sum of Even Number(1-10)", "7", "23/09/25", "06/10/25", ""),
        ("04", "Finding Smallest Number\nin an Array", "8", "25/09/25", "06/10/25", ""),
        ("05", "Sorting Array Elements in\nAscending order", "9", "06/10/25", "13/10/25", ""),
        ("06", "Calculate Factorial of a\nnumber", "10", "13/10/25", "14/10/25", ""),
        ("07", "Calculate multiplication of\ntwo 2x2 matrices", "10", "14/11/25", "24/10/25", ""),
        ("08", "Recursion", "10", "19/10/25", "03/11/25", ""),
        ("09", "MATLAB Programming -\n(Addition, Subtraction, Multiplication)", "13-13", "28/10/25", "03/11/25", ""),
        ("10", "Plotting a Sinusoidal wave\nfigure", "14", "09/11/25", "10/11/25", ""),
        ("11", "Solving linear Equation using\nmatrix Division", "15", "11/11/25", "11/11/25", ""),
        ("12", "MATLAB Simulink: Modeling\na simple DC Motor speed\nControl", "16-18", "11/11/25", "25/11/25", ""),
    ]
    
    c.setFont("Helvetica", 7.5)
    current_y = table_top - row_height
    
    for sl, name, page, date_exp, date_sub, remarks in experiments:
        # Determine row height based on content
        name_lines = name.split('\n')
        this_row_height = max(row_height, len(name_lines) * 0.35*cm + 0.4*cm)
        
        # Draw row border
        c.rect(inner_left, current_y - this_row_height, table_width, this_row_height)
        
        # Vertical lines
        for i, start in enumerate(col_starts[1:], 1):
            c.line(start, current_y, start, current_y - this_row_height)
        
        # Cell content
        text_y = current_y - 0.35*cm
        
        # Sl No
        c.drawCentredString(col_starts[0] + col_widths[0]/2, text_y, sl)
        
        # Experiment name (multi-line)
        for j, line in enumerate(name_lines):
            c.drawString(col_starts[1] + 0.1*cm, text_y - j*0.3*cm, line)
        
        # Page No
        c.drawCentredString(col_starts[2] + col_widths[2]/2, text_y, page)
        
        # Date of experiment
        c.drawCentredString(col_starts[3] + col_widths[3]/2, text_y, date_exp)
        
        # Date of submission
        c.drawCentredString(col_starts[4] + col_widths[4]/2, text_y, date_sub)
        
        # Remarks
        c.drawCentredString(col_starts[5] + col_widths[5]/2, text_y, remarks)
        
        current_y -= this_row_height
    
    c.showPage()


def main():
    output_file = "/home/incognito/Code/anonlink/Lab_Notebook.pdf"
    c = canvas.Canvas(output_file, pagesize=A4)
    c.setTitle("Programming for Problem Solving - Lab Notebook")
    c.setAuthor("Saroj Parida")
    
    # Generate all 6 pages in order matching the images
    page1_certificate(c)      # Certificate page
    page2_experiment1(c)      # Exp 01 - Displaying College Name (code)
    page3_arrays(c)           # Arrays topic
    page4_operators_io_control(c)  # Operators, I/O, Control
    page5_intro_basic_structure(c) # Introduction & Basic Structure
    page6_index(c)            # Index table
    
    c.save()
    print(f"PDF generated successfully: {output_file}")


if __name__ == "__main__":
    main()
