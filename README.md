# AI/ML Internship – Zynvex Solutions

Hello everyone! I am **Numair Fahad**, a BSCS undergraduate at the **National University of Technology (NUTECH), Islamabad**, currently working as an **AI/ML Intern at Zynvex Solutions**. This repository contains all my assignments, projects, and learning activities completed during the AI/ML Internship Program at Zynvex Solutions. I look forward to strengthening my Python, Machine Learning, and Deep Learning skills while building practical AI solutions throughout this internship.

## 📂 Repository Contents

| Lab / Assignment | Topic                                      | Status       | Key Files |
|------------------|--------------------------------------------|--------------|-----------|
| Lab 2            | NumPy & Pandas Basics                      | Completed    | `Lab2_NumairFahad.ipynb` |
| Lab 3            | Data Cleaning & Preprocessing              | Completed    | `Lab3_NumairFahad.ipynb`, `employee_records_clean.csv` |
| Lab 4            | Data Visualization with Matplotlib & Seaborn | Completed  | `Lab4_NumairFahad.ipynb`, `titanic.csv` |
| Assignment 01    | Comprehensive EDA on NYC Airbnb Listings   | Completed    | `Assignment01_Airbnb_EDA.ipynb`, `new_york_airbnb_cleaned.csv` |

> More labs and assignments will be added as the internship progresses.

---

## 🛠️ Technologies & Tools

- **Programming Language**: Python
- **Libraries**: NumPy, Pandas, Matplotlib, Seaborn
- **Environment**: Google Colab, Jupyter Notebook, VS Code
- **Version Control**: Git & GitHub

---

## 📊 Cleaned Dataset

### Lab 03 - Employee Records Dataset

- **`employee_records_clean.csv`** — A cleaned version of the messy employee dataset after performing:
  - Inspection of the dataset.
  - Handling missing values (`Age` with median, `Salary` with mean).
  - Removing duplicate rows.
  - Standardizing inconsistent text (employee names and department names).
  - Splitting `Department_Region` into two independent `Department` and `Region` columns.
  - Fixing incorrect data types (especially the `Phone` column).
  - Detecting and handling outliers using the IQR method.

### Lab 04 - Titanic Dataset

- **`titanic.csv`** — The classic Titanic passenger dataset used for data visualization and exploratory analysis. The following tasks were performed on this dataset:

  - Inspected the dataset structure using `df.info()` and `df.describe()`.
  - Separated numeric and categorical columns using `select_dtypes()`.
  - Created a **histogram** to visualize the distribution of passenger ages.
  - Created a **bar chart** to show the number of passengers in each class.
  - Created a **box plot** to compare fare distribution across passenger classes.
  - Created a **correlation heatmap** to explore relationships between distinct numerical variables.
  - Built a **scatter plot** of Age vs Fare colored by survival status.
  - Analyzed survival rates by grouping data on `Pclass` and `Sex`.

### Assignment 01 - NYC Airbnb Dataset

- **`new_york_airbnb_cleaned.csv`** — Cleaned version of the New York City Airbnb listings dataset.  
  Work performed includes:
  - Handling missing values
  - Removing outliers in `price` and `minimum_nights`
  - Feature engineering (`price_category`)
  - Univariate, bivariate, and multivariate analysis
  - Key insights and actionable recommendation

## 🚀 How to Use

1. Clone this repository:
   ```bash
   git clone https://github.com/numair-2003/AIML-Internship-NumairFahad.git
   
## 👨‍💻 Author

- **Name:** Numair Fahad
- **Role:** AI/ML Intern
- **Company:** Zynvex Solutions
- **GitHub:** [numair-2003](https://github.com/numair-2003)
